// Use dynamic import for node-fetch
import fetch from "node-fetch";
const SUBGRAPH_URLS = {
    // Ethereum Mainnet
    "1": "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2",
    // Polygon (MATIC)
    "137": "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-polygon-v2",
    // Arbitrum
    "42161": "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-arbitrum-v2",
    // Optimism
    "10": "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-optimism-v2",
    // Gnosis Chain (formerly xDai)
    "100": "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gnosis-chain-v2",
    // Avalanche
    "43114": "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-avalanche-v2",
    // Polygon zkEVM
    "1101": "https://api.studio.thegraph.com/query/24660/balancer-polygon-zk-v2/version/latest",
    // Base
    "84532": "https://api.studio.thegraph.com/query/24660/balancer-base-v2/version/latest",
};
const GET_POOLS_QUERY = `
  query GetPools($lastTimestamp: Int) {
    pools(
      first: 1000,
      orderBy: createTime,
      orderDirection: asc,
      where: { createTime_gt: $lastTimestamp }
    ) {
      address
      createTime
      tokens {
        symbol
        name  
      }
    }
  }
`;
async function returnTags(chainId, apiKey) {
    let lastTimestamp = 0;
    let allTags = [];
    let isMore = true;
    // Use the chainId to get the correct Subgraph URL from the mapping
    const subgraphUrl = SUBGRAPH_URLS[chainId];
    if (!subgraphUrl) {
        throw new Error(`Unsupported Chain ID: ${chainId}. No matching Subgraph URL found.`);
    }
    // Then, use `subgraphUrl` in your fetch call
    while (isMore) {
        const response = await fetch(subgraphUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${apiKey}`, // Assuming the API key is needed for all requests
            },
            body: JSON.stringify({
                query: GET_POOLS_QUERY,
                variables: { lastTimestamp: lastTimestamp },
            }),
        });
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const result = (await response.json());
        const pools = result.data.pools;
        allTags.push(...transformPoolsToTags(chainId, pools));
        if (pools.length < 1000) {
            isMore = false;
        }
        else {
            // Assuming 'createTime' is now a property on the returned pools, which needs verification
            lastTimestamp = parseInt(pools[pools.length - 1].createTime.toString());
        }
    }
    return allTags;
}
// Adjusted transformation function to match the updated Pool interface
function transformPoolsToTags(chainId, pools) {
    return pools.map((pool) => ({
        "Contract Address": `eip155:${chainId}:${pool.address}`,
        "Public Name Tag": `${pool.tokens.map((t) => t.symbol).join("/")} Pool`,
        "Project Name": "Balancer v2",
        "UI/Website Link": "https://balancer.fi/",
        "Public Note": `A Balancer v2 pool with tokens ${pool.tokens
            .map((t) => t.name)
            .join(", ")}.`,
    }));
}
export { returnTags };
