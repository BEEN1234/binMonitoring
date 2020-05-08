var binMaster = {};

document.addEventListener("load", autoLogin());

function autoLogin(){
    var authToken = localStorage.getItem('authToken');

    const Data = {authToken: authToken};
    const http = new XMLHttpRequest();
    http.open('POST', '/sensors/autoLogin');
    http.setRequestHeader('Content-Type', 'application/json')
    http.send(JSON.stringify(Data));
    http.onreadystatechange = () => {
        if(http.readyState === 4 && http.status === 200){
            binMaster = JSON.parse(http.response);
            genHtml();
        }
    }
}

function genHtml(){
    binMaster.bins.forEach((bin) => {//need to create div(bins) and append to that? or add all together and append to body?
        var thisBIN = document.createElement('div');
        thisBIN.className = "bins";
        thisBIN.innerHTML = `<h3>${bin.bin}</h3>
            <h4 class="floatleft">Set whole bin: </h4>
            <input class="floatleft" type="number" id="set${bin.bin}">
            <button class="floatleft" onclick="setBin(&#39;${bin.bin}&#39;)">Set</button>
            <h4 class="floatleft">Mute whole bin: </h4><button onclick="muteBin(&#39;${bin.bin}&#39;)">mute</button>
            <button onclick="muteBin(&#39;${bin.bin}&#39;, false)">unmute</button>
            `;
        var table = document.createElement('table');
        table.className = bin.bin+"table";
        var tr = document.createElement('tr');
        bin.cables.forEach((cable) => {
            let th = document.createElement('th');
            th.innerHTML = `<h4 class="cableName">cable name: c</h4>
                <p class="floatleft">Set whole cable: </p>
                <input class="floatleft" id="set${bin.bin}${cable.cable}" type="number">
                <button class="floatleft" onclick="setCable(&#39;${bin.bin}&#39;, &#39;${cable.cable}&#39;)">Set</button>
                <p class="floatleft">Mute whole Cable:</p>
                <button class="floatleft" onclick="muteCable(&#39;${bin.bin}&#39;, &#39;${cable.cable}&#39;)" id="mute${bin.bin}${cable.cable}">mute</button>
                <button class="floatleft" onclick="muteCable(&#39;${bin.bin}&#39;, &#39;${cable.cable}&#39;, false)" id="mute${bin.bin}${cable.cable}">unmute</button>`;
            tr.appendChild(th);
        });
        table.appendChild(tr);
        bin.cables[0].sensors.forEach((sensor, index) => {//w'in I need to make td iteratively for each cable
            let dataTr = document.createElement('tr');
            bin.cables.forEach((cable) => {
                let td = document.createElement('td'); //cable.sensors[index]._id!!!; perhaps to set i'll need bin-cable-sensor id. i like that most
                let buttonHtml;
                if(cable.sensors[index].muted){
                    buttonHtml = `<p class="floatleft muted">this sensor is muted </p><button class="floatleft" onclick="unmuteSensor('${cable.sensors[index]._id}')">unmute</button>`;
                }
                else{
                    buttonHtml = `<p class="floatleft unmuted">this sensor is unmuted </p><button class="floatleft" onclick="muteSensor('${cable.sensors[index]._id}')">mute</button>`;
                }
                td.innerHTML = `<p class="floatleft">Set this sensor: </p>
                    <input class="floatleft" type="number" id="set${cable.sensors[index]._id}" value="${cable.sensors[index].alert}">
                    <button class="floatleft" onclick="setSensor(&#39;${cable.sensors[index]._id}&#39;)">Set</button>
                    ${buttonHtml}`;
                dataTr.appendChild(td);
            });
            table.appendChild(dataTr);
        });
        document.body.appendChild(thisBIN);
        document.body.appendChild(table);
    })
}//need to load each sensors alert and muted state with +_id... maybe i'll get another route and add all that to binMaster

function linearizeBin(bin, cb){
    for(let i=0; i<bin.cables.length; i++){
        for(let j=0; j<bin.cables[i].sensors.length; j++){
            cb(bin, i, j);
        };
    };
}

function sendIt(array, settingAlert=true){
    var Data = {
        authToken: localStorage.getItem('authToken'),
        data: array,
        settingAlert: settingAlert
    }
    const http = new XMLHttpRequest();
    http.open('POST', '/sensors/alerts');
    http.setRequestHeader('Content-Type', 'application/json')
    http.send(JSON.stringify(Data));
    http.onreadystatechange = () => {
        if(http.readyState === 4 && http.status === 200){
            // binMaster = JSON.parse(http.response);
            console.log('http.response: '+ JSON.stringify(http.response));
        }
    }
}

function setBin(bin){
    var array =[]
    var temp = document.getElementById("set"+bin).value;
    binMaster.bins.forEach((eachBin) => {
        if(eachBin.bin===bin){
            // array of id's...
            linearizeBin(eachBin, (eachBin, index, jcount) => {
                array.push({
                    _id: eachBin.cables[index].sensors[jcount]._id,
                    alert: temp
                });
            });
        }
    });
    sendIt(array);
}

function muteBin(bin, muting=true){
    var array = [];
    binMaster.bins.forEach((eachBin) => {
        if(eachBin.bin===bin){
            // array of id's...
            linearizeBin(eachBin, (eachBin, index, jcount) => {
                array.push({
                    _id: eachBin.cables[index].sensors[jcount]._id,
                    muted: muting
                });
            });
        }
    });
    sendIt(array, false);
}

function setCable(bin, cable){
    var temp = document.getElementById("set"+bin+cable).value;
    var array = [];
    binMaster.bins.forEach((eachBin) => {
        eachBin.cables.forEach((eachCable) => {//bad code. i guess make linearize cable?
            if(eachBin.bin===bin && eachCable.cable===cable){
                // array of id's...
                for(let i=0; i<eachCable.sensors.length; i++){
                    array.push({
                        _id: eachCable.sensors[i]._id,
                        alert: temp
                    });
                };
            }
        })
    });
    sendIt(array);
}

function muteCable(bin, cable, muting=true){
    var array = [];
    binMaster.bins.forEach((eachBin) => {
        eachBin.cables.forEach((eachCable) => {//bad code. i guess make linearize cable?
            if(eachBin.bin===bin && eachCable.cable===cable){
                // array of id's...
                for(let i=0; i<eachCable.sensors.length; i++){
                    array.push({
                        _id: eachCable.sensors[i]._id,
                        muted: muting
                    });
                };
            }
        })
    });
    sendIt(array, false);
}

function setSensor(id){
    var temp = document.getElementById(id).value;
    var thingoSensor = {
        _id: id,
        alert: temp
    };
    sendIt([thingoSensor]);
}

function muteSensor(id, muting=true){
    var thingoSensor = {
        _id: id,
        muted: muting
    };
    sendIt([thingoSensor], false);
}