const fs = require("fs-extra");
const path = require("path");

async function copyDirectory(src, dest) {
  try {
    await fs.copy(src, dest, {
      overwrite: true,
      errorOnExist: false,
    });
    console.log(`Directory copied from ${src} to ${dest}`);
  } catch (err) {
    console.error(`An error occurred while copying the directory: ${err}`);
  }
}

// Please run within the `scripts` directory
function buildDirectoryStructure(rootPath) {
  const result = {
    type: "directory",
    name: path.basename(rootPath),
    contents: [],
  };

  let dirCount = 0;
  let fileCount = 0;

  function exploreDirectory(currentPath, parentNode) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (let entry of entries) {
      if (entry.isDirectory()) {
        const dirNode = {
          type: "directory",
          name: entry.name,
          contents: [],
        };
        parentNode.contents.push(dirNode);
        dirCount++;
        exploreDirectory(path.join(currentPath, entry.name), dirNode);
      } else if (entry.isFile()) {
        parentNode.contents.push({
          type: "file",
          name: entry.name,
        });
        fileCount++;
      }
    }
  }

  exploreDirectory(rootPath, result);

  // Append the report at the root level
  result.report = { directories: dirCount, files: fileCount };
  return [result];
}

function saveStructureToJson(rootPath, jsonFilePath) {
  const structure = buildDirectoryStructure(rootPath);
  fs.writeFileSync(jsonFilePath, JSON.stringify(structure, null, 2));
}

// Example usage
const main = async () => {
  const srcDirectory = path.resolve(__dirname, "../../protocols"); // Adjust the source path
  const destDirectory = path.resolve(__dirname, "../static/protocols"); // Destination is the current directory
  const jsonFilePath = "../static/data/protocol-directory-tree.json"; // The JSON output file path

  await copyDirectory(srcDirectory, destDirectory);
  saveStructureToJson(destDirectory, jsonFilePath);
};

main()
  .then(() => console.log("Operation completed."))
  .catch((err) => console.error(err));
