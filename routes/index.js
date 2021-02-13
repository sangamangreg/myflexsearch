const express = require("express");
const FlexSearch = require("flexsearch");
const wsData = require("../daos/alan_data");


const preset = "score"; 
const searchIndex = new FlexSearch(preset);
const router = express.Router();


function buildIndex() {
  const data = wsData.data;
  console.info("Building index starts");
  for (let i = 0; i < 100; i++) {
    const content = data[i].title + " " + data[i].content;
    const key = i + 1;
    searchIndex.add(key, content);
    // console.info(key + " ===== " + content);  
  }
  console.info("Building index ends");
}

buildIndex();

// search API to respond back to client query
router.get("/search", async (request, response, next) => {
  try {
    if (searchIndex.length === 0) {
      await buildIndex();
    }
    const phrase = request.query.phrase;
    if (!phrase) {
      throw Error("phrase query parameter empty");
    }
  
    const results = findDocument(phrase);
    let htmlResult = "<div style='display: inline;'>";
    for (let i =0; i<results.length; i++) {
      htmlResult = htmlResult + "<div style='box-shadow: 1px 1px #dadada;border: 1px solid #dadada;min-height: 250px;width: 30%;float: left;padding: 5px;margin: 15px;'><div style='line-height: 2rem;'><strong>" + results[i].title + "</strong></div>";
      htmlResult = htmlResult + "<div class='content'>" + results[i].content + "</div></div>";
    }
    htmlResult = htmlResult + "</div>";
    response.writeHead(200,"{Content-Type:text/html}"); 
    response.end(htmlResult);

  } catch (e) {
    next(e);
  }
});

// This function to find document 
function findDocument(str) {
  console.info("Searching by: " + str);
  const resultIds = searchIndex.search({
    query: str,
    suggest: true,
    limit:20
  });
  console.info("results: " + resultIds.length);
  console.info(resultIds);
  const results = getDataByIds(resultIds);
  return results;
}

// once we have ids in return we have to get data.
function getDataByIds(idsList) {
  const result = [];
  const data = wsData.data;
  for (let i = 0; i < data.length; i++) {
    if (idsList.includes(i + 1)) {
      result.push(data[i]);
    }
  }
  return result;
}

module.exports = router;