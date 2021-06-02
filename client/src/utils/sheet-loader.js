var Tabletop = require('tabletop');

function loadSheet (url) {
    return new Promise((resolve, reject) => {
        var promisedData =  loadGoogleSpreadsheet(url);
        promisedData.then(function(result){
            resolve(result);
        })
        .catch(function(){
            reject(new Error('Unable to load the sheet'));
        });
    });

    function loadGoogleSpreadsheet(url){
        return new Promise((resolve) => {
          Tabletop.init({
              key: url,
              callback: function(data) {
                resolve(data);
              },
              simpleSheet: false
          });
      })
    }
}

export default loadSheet;