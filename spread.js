#!/usr/bin/env node
'use strict';
const https = require('https');

const includeFrozen = process.argv.includes('--include-frozen');
const includeZeroVolume = process.argv.includes('--include-zero-volume');

if (process.argv.includes('--help')) {
console.log('$ node spread.js [options] \n'+
'A simple javascript cli Poloniex market spread analyser across all tradable assets \n\n'+
'Options: \n' +
'  --include-frozen           Include frozen assets on the exchange \n'+
'  --include-zero-volume      Include assets with zero market volume\n'
);
return;
}

https.get('https://poloniex.com/public?command=returnTicker', (resp) => {
  let data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole reisponse has been received.
  resp.on('end', () => {
    let toReturn = [];
    let biggestPairStrLen = 0;
    let biggestSpreadStrLen = 0;   
    let biggestMarginStrLen = 0;   

    let fullData = JSON.parse(data);
    Object.keys(fullData).forEach((key) => {
       if (!includeFrozen && fullData[key]['isFrozen'] == 1) {
         return;
       }
       if (!includeZeroVolume && (
		Number.parseFloat(fullData[key]['baseVolume']) == 0 ||               
		Number.parseFloat(fullData[key]['quoteVolume']) == 0
       )) {
         return;
       }
       
       if (key.toString().length > biggestPairStrLen) {
         biggestPairStrLen = key.toString().length;
       }

       let ask = Number.parseFloat(fullData[key]['lowestAsk']),
       bid = Number.parseFloat(fullData[key]['highestBid']),
       spread = (ask - bid).toFixed(8).replace(/\.?0+$/,""),
       margin = (((ask - bid) / ask ) * 100);

       if (spread.toString().length > biggestSpreadStrLen) {
         biggestSpreadStrLen = spread.toString().length;
       }

       if (margin.toString().length > biggestMarginStrLen) {
         biggestMarginStrLen = margin.toString().length;
       }


       toReturn.push({
         pair: key,
         spread: spread,
         margin: (((ask - bid) / ask ) * 100),
         volume: fullData[key]['baseVolume']
      });
    });

    toReturn.sort(function(a,b) {
        return b.margin - a.margin;
    });
   
    toReturn.forEach((entry)=>{
      console.log(entry.pair.padEnd(biggestPairStrLen,' ') + ' Spread: ' + entry.spread.padEnd(biggestSpreadStrLen,'0') + ' Margin: ' + entry.margin.toString().padEnd(biggestMarginStrLen, '0') + ' % Base volume: '+ entry.volume);
    });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
});
