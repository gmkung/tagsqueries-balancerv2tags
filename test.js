import { returnTags } from "balancerv2tags"; // Adjust this require as necessary
import { writeFile } from "fs/promises";

function jsonToCSV(items) {
  const replacer = (key, value) => (value === null ? "" : value);
  const header = Object.keys(items[0]);
  const csv = [
    header.join(","), // header row first
    ...items.map((row) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(",")
    ),
  ].join("\r\n");

  return csv;
}

async function gatherTagsForChains(chainIds, apiKey) {
  let allTags = [];

  for (const chainId of chainIds) {
    try {
      const tags = await returnTags(chainId, apiKey);
      if (Array.isArray(tags)) {
        allTags.push(...tags);
      } else {
        console.error(`Failed to fetch tags for chain ID ${chainId}`);
      }
    } catch (error) {
      console.error(`Error fetching tags for chain ID ${chainId}:`, error);
    }
  }

  return allTags;
}

async function test() {
  const chainIds = [1, 137, 42161, 10, 100, 43114, 5]; // Example chain IDs
  const apiKey = "A20CharacterApiKeyThatWorks";

  try {
    const tags = await gatherTagsForChains(chainIds, apiKey);
    if (tags.length > 0) {
      // Convert JSON to CSV
      const csv = jsonToCSV(tags);
      // Output CSV to a file
      await writeFile("tags.csv", csv);
      console.log("Tags have been written to tags.csv");
    } else {
      console.log("No tags were gathered.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

test();
