var gemoji = require('gemoji');


var keyword = '😑';

var result = gemoji.unicode[keyword]; 

if(typeof result !='undefined')
    // console.log("emoji text: "+result.name);
    {
    // keyword = result['name'].replace(/_/g, " ");
    keyword = result['name'].split("_");
    console.log("Emoji spotted. keyword translated to %s",keyword[0]);
    }
    
else
    console.log("Keyword remains as "+keyword);

// if(typeof keyword == 'undefined')
// {
//     console.log("Not an emoji. Keyword remains :"+keyword);
// }
// else
// {
//     var res = gemoji.unicode[keyword];
//     console.log("Emoji spotted. keyword %s translated to %s",keyword,res['name']);
// }
// console.log(gemoji.unicode[keyword]);
// console.log(gemoji.unicode['hello']);
