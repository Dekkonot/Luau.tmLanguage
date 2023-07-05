import fs = require("fs");
import path = require("path");
import chai = require("chai");
import build = require("./build");

const generatedFolder = path.join(__dirname, "generated");
const baselineFolder = path.join(__dirname, "baselines");
const casesFolder = path.join(__dirname, "cases");

function ensureCleanGeneratedFolder() {
  if (fs.existsSync(generatedFolder)) {
    for (const fileName of fs.readdirSync(generatedFolder)) {
      fs.unlinkSync(path.join(generatedFolder, fileName));
    }
    fs.rmdirSync(generatedFolder);
  }
  fs.mkdirSync(generatedFolder);
}

// Ensure generated folder
ensureCleanGeneratedFolder();

// Generate the new baselines
for (const fileName of fs.readdirSync(casesFolder)) {
  describe("Generating baseline for " + fileName, () => {
    let wholeBaseline: string;
    let parsedFileName: path.ParsedPath;

    before((done) => {
      const text = fs.readFileSync(path.join(casesFolder, fileName), "utf8");
      parsedFileName = path.parse(fileName);
      build.generateScopes(text, parsedFileName).then((result) => {
        wholeBaseline = result;
        done();
      });
    });
    after(() => {
      wholeBaseline = undefined!;
      parsedFileName = undefined!;
    });

    it("Comparing baseline", () => {
      assertBaselinesMatch(
        parsedFileName.name + ".baseline.txt",
        wholeBaseline
      );
    });
  });
}

function assertBaselinesMatch(file: string, generatedText: string) {
  const generatedFileName = path.join(generatedFolder, file);
  fs.writeFileSync(generatedFileName, generatedText);

  const baselineFile = path.join(baselineFolder, file);
  if (fs.existsSync(baselineFile)) {
    const baselineText = fs.readFileSync(baselineFile, "utf8");

    chai.assert.equal(
      generatedText,
      baselineText,
      "Expected baselines to match: " + file
    );

    // If they *are* equal, lets delete the baseline file to make it easier to notice
    // failing cases
    if (generatedText == baselineText) {
      fs.unlinkSync(generatedFileName);
    }
  } else {
    chai.assert(false, "New generated baseline");
  }
}
