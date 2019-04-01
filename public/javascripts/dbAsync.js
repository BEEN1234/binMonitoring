
function update(i, sensorId) {
    const Http = new XMLHttpRequest();
    const route='http://localhost:3000/sample/liveupdate';
    const startId = "start" + i;
    const endId = "end" + i;
    const start = document.getElementById(startId).value;
    const end = document.getElementById(endId).value;
    var url = route + "/" + start + "/" + end + "/" + sensorId;
    Http.open("GET", url);  
    Http.send();
    Http.onreadystatechange=(e)=>{
        if (Http.readyState == 4 && Http.status == 200) {
            var myDataPlotly;
            var myDivPlotly;
            var myDataObject;
            var myDataArray;
            myDataPlotly = JSON.parse(Http.response);
            myDivPlotly = 'myDiv' + i;
            const xRange = new Date(myDataPlotly.x[myDataPlotly.x.length-1]).getTime() - new Date(myDataPlotly.x[0]).getTime();
            //now in something like 500 pixels I should have 31*24*60*60*1000. pixels/ms * range;;
            var defaultWidth = 900;
            var width = (defaultWidth/(31*24*60*60*1000)) * xRange;
            if(width < defaultWidth) {
                width = defaultWidth;
            };
            const layout = {
                width: width
            };
            myDataObject = {
                x: myDataPlotly.x,
                y: myDataPlotly.y,
                mode: 'lines+markers',
                type: 'scatter'
            };
            myDataArray = [myDataObject];
            Plotly.newPlot(myDivPlotly, myDataArray, layout);
        };
    };
};