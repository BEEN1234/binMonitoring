const fifteenMin = 15*60*1000;
var binMaster = {};
window.addEventListener("load", acPopulateStore());
window.addEventListener("load", autoLogin());
var sampleBool = false;//set this on sample
let sampleObj = { //this mimmicks all the other things, but only in memory.
    bins: [
        {
        cables: [
        {
        sensors: [
            "5c9ff83c3ea6a81ad9584228",
            "5c9ff83c3ea6a81ad9584229",
            "5c9ff83c3ea6a81ad958422f",
            "5c9ff83c3ea6a81ad9584234"
        ],
        _id: "5d38999b2f57bc3930aa8ba8",
        cable: "centre"
        }
        ],
        _id: "5d38999b2f57bc3930aa8ba7",
        bin: "Sample Bin",
        averageTemp: null,
        maxTempOfBin: 0
        }
    ],
    vCables: [
        {
        sensors: [
            "5c9ff8303ea6a81ad95841fa",
            "5c9ff8303ea6a81ad95841fd",
            "5c9ff8303ea6a81ad95841ef",
            "5c9ff8303ea6a81ad95841ff"
        ],
        _id: "5d3899152f57bc3930aa8ba3",
        id: 4,
        class: "4s-20ft-cable"
        },
        {
        sensors: [
            "5c9ff8303ea6a81ad95841da",
            "5c9ff8303ea6a81ad95841ed",
            "5c9ff8303ea6a81ad95841e3",
            "5c9ff8303ea6a81ad95841ec"
        ],
        _id: "5d38998f2f57bc3930aa8ba5",
        id: 3,
        class: "4s-20ft-cable"
        }
    ],
    addCableToBins(id){
        const tr = document.getElementsByClassName("setupCable"+id)[0];
    
        var prevBin = "setupCablesBinName" + id;
        var newBin = "setupCablesNewBinName" + id;
        var cableName = "setupCablesCableName" + id;
        prevBin = document.getElementById(prevBin).value;
        newBin = document.getElementById(newBin).value;
        cableName = document.getElementById(cableName).value;
        let thisBin = {
            cables: [],
            bin: newBin,
        }
        let thisCable;
        this.vCables.forEach((cable, index) => {
            if(id === cable.id){
                thisCable = this.vCables.splice(index, 1);
                thisCable = thisCable[0];
            }
        });
        thisCable.cable = cableName;
        thisBin.cables.push(thisCable);
        this.bins.push(thisBin);
        tr.parentNode.removeChild(tr);
        let cablesNum = this.vCables.length;
        document.getElementById('cablesToSetup').innerHTML = cablesNum;
        buildBinsDiv(sampleObj);
        updateTemperatures();
    }
    /**each call has to cehck the bool? and then muse a memory method?
     *add cable to bins
     *get all the ids
     * so i guess i'll set binMaster to sample and call build binsDiv each time?... all I need to do is get temps. easy. just a new route
     * and ... 
     * 
     * cable to bins - super dupuer easy
     * temperatures
     * 
     
      */
}

function viewSample(){
    sampleBool = true;
    binMaster = sampleObj;
    document.getElementsByClassName('introContainer')[0].style.display = "none";
    buildBinsDiv(binMaster);
    populateSetupCables();
    updateTemperatures();
}
//on sample click need to buildBinsDiv. on add Cable need to 

// document.getElementsByClassName("userControl")[0].addEventListener("click", logout());//for some reason this is running on load

function buildBinsDiv(binMaster){
    const binCardHTML = '<div class="binHeader"><h3 class="binH3">BinName</h3><p class="binTempHighest">Highest Temp</p><p>/</p><p class="binTempAverage">Average</p></div><div class="binBackground"></div><div class="binCables"><h3>Cables: </h3><table class="cableTable"></table></div>';
    const binsDiv = document.getElementById('bins');
    binsDiv.innerHTML = '';
    if(binMaster){
        for (var i=0; i<binMaster.bins.length; i++) {
            let thisBin = binMaster.bins[i];
            buildABin(thisBin, binCardHTML, binsDiv);
        };
    };
}

function buildABin(binMasterBin, binInnerHtml, parentNode){
    let newBinCard = document.createElement('div')
    newBinCard.innerHTML = binInnerHtml;
    newBinCard.className = "bin";
    //addTitle, genTable
    let cableTable = newBinCard.getElementsByClassName('cableTable')[0];
    let binCardTitle = newBinCard.getElementsByClassName('binH3')[0]
    binCardTitle.innerHTML = binMasterBin.bin;
    newBinCard.getElementsByClassName('binTempHighest')[0].id = binMasterBin.bin + 'Temp' + 'Highest';
    newBinCard.getElementsByClassName('binTempAverage')[0].id = binMasterBin.bin + 'Temp' + 'Average';
    genRow(false, 'th', cableTable, binMasterBin.bin, ...binMasterBin.cables);//recursive
    parentNode.appendChild(newBinCard);

    // here update the temp too... but just of this bin?
}
//need a mute button and number field. clicking the manage button loads in the current states. should be pretty easy
//alerts will have to just say - problem, look up online;
//
function genRow(alertsBool, th, table, binName, ...cables){//to refit for manage alerts- just need a unique id? then I'll append inner html after?
    const row = document.createElement('tr');
    for (var j=0; j<cables.length; j++) {
        let cable = cables[j];
        let cell = document.createElement(th);
        cell.id = binName + '-%$&%-' + cable.cable + '-%$&%-' + (table.children.length - 1);
        th === 'th' ? cell.innerHTML = cable.cable : cell.innerHTML = '';//if alertBool innerhtml = cable.cable +set whole cable: input set mute
        row.appendChild(cell); //
    }
    table.appendChild(row);
    
    var longestCable = 0;
    for (var i=0; i<cables.length; i++) {
        if(cables[i].sensors.length > longestCable){
            longestCable = cables[i].sensors.length
        };
    }
    if(table.children.length === (longestCable + 1)){//how to know -> if table.children.length === ...cable.length.
        return;
    }
    else {
        genRow(alertsBool, 'td', table, binName, ...cables);
    };
}

function updateTemperatures(){
    let url;
    if(sampleBool) url = '/sample/sensorReads';
    else url = '/sensorReads';
    const sensorIdArray = [];
    linearizeBinMaster((bin, cable, sensor, k, counter) => {
        sensorIdArray.push(sensor);
    });

    const Data = {
        sensorArray: sensorIdArray,
    };
    if(!sampleBool) Data.authToken = localStorage.getItem('authToken');

    const fetchOptions = {
        method: "POST",
        mode: "cors",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(Data),
    }
    if(binMaster.bins.length){
        fetch(url, fetchOptions)
            .then((x) => { return x.json() })
            .then((x) => { return populateTemperatureFields(x) })
            .then((x) => {
                const timeoutTime = x + fifteenMin - Date.now(); //here is the kicker
                if(timeoutTime < 0){
                    setTimeout(updateTemperatures, fifteenMin);//
                    throw 'Sensor Error - No data';
                } //add this to the popTemp and user flashes
                else setTimeout(updateTemperatures, timeoutTime);
            })
            .catch((err) => {
                console.log(err);
            });
    }
    else {
        setTimeout(updateTemperatures, fifteenMin);//call stack exceeded..., this runs immediately
    };
};

var latestTemperatureUpdate = 0; //should be global...er sumthin

function populateTemperatureFields(fetchResponse){
    var mssSensorUpdate = 0;
    var runningTempTotal = 0;
    var numberOfSensors = 0;
    var maxTempOfBin = 0;
    var binName = '';
    
    linearizeBinMaster((bin, cable, sensor, k, counter) => {
        if(binName !== bin.bin){
            runningTempTotal = 0;
            numberOfSensors = 0;
            maxTempOfBin = 0;
            binName = bin.bin;
        }
        var read = fetchResponse.sensorArray[counter].read;
        var time = fetchResponse.sensorArray[counter].time;
        time = new Date(time).getTime(); //here check if it's more than 15 minutes from now

        let now = Date.now();
        let oldUpdateBool = false;
        if((now - time) > fifteenMin) oldUpdateBool = true;

        let cell = document.getElementById(bin.bin + '-%$&%-' + cable.cable + '-%$&%-' + k);
        if(oldUpdateBool){
            cell.innerHTML = "no update";
        }
        else{
            cell.innerHTML = read/10 + '<sup>o</sup>C';
            runningTempTotal += read;
            if(read > maxTempOfBin) maxTempOfBin = read;
            numberOfSensors++;
        };

        if(time > mssSensorUpdate) mssSensorUpdate = time; //global var


        bin.averageTemp = runningTempTotal/numberOfSensors;
        bin.maxTempOfBin = maxTempOfBin;
    });

    for (var i=0; i<binMaster.bins.length; i++) {
        const bin = binMaster.bins[i];
        setTempById(bin.bin + 'TempAverage', binMaster.bins[i].averageTemp);
        setTempById(bin.bin + 'TempHighest', binMaster.bins[i].maxTempOfBin);
    }

    return mssSensorUpdate;
}

function linearizeBinMaster(cb){ //warning, this doesn't take an argument, but uses the global binMaster
    var counter = 0;
    for (var i=0; i<binMaster.bins.length; i++) {
        var bin = binMaster.bins[i];
        for (var j=0; j<bin.cables.length; j++) {
            var cable = bin.cables[j];
            for (var k=0; k<cable.sensors.length; k++) {
                var sensor = cable.sensors[k];
                cb(bin, cable, sensor, k, counter);
                counter++;
            }
        }
    }
}

function setTempById(id, temp){
    const element = document.getElementById(id);
    if(temp) element.innerHTML = temp/10 +'<sup>o</sup>C';
    //can add style later
}

function getUserInput(login=true, confirm=false){
    //divName - login or register div name
    var childrenClass = '';
    if(login){
        childrenClass = "loginInput";
    }
    else{
        childrenClass = "registerInput";
    }
    var parentClass = '';
    if(login){
        if(confirm){
            var parentClass = "loginUserConfirmContainer";
        }
        else{
            var parentClass = "loginUserContainer";
        };
    }
    else{
        if(confirm){
            var parentClass = "registerUserConfirmContainer";
        }
        else{
            var parentClass = "registerUserContainer";
        };
    };
    var parent = document.getElementsByClassName(parentClass)[0];
    var input = parent.getElementsByClassName(childrenClass);
    var phonenumber = "";
    var failure = false;
    var re = /[0-9]/;
    for(let i=0; i<input.length; i++){
        if(input[i].value.length!==3 && i<2){
            input[i].style.borderColor = "red";
            addFlash("failure", "Please use only 3 numbers for the phone number", "bannerFlashes", 2000);
            failure = true;
            break;
        };
        if(input[i].value.length!==4 && i===2){
            input[i].style.borderColor = "red";
            addFlash("failure", "Please use only 4 numbers for the phone number", "bannerFlashes", 2000);
            failure = true;
            break;
        };
        for(let j=0; j<input[i].value.length; j++){
            if(re.exec(input[i].value[j]) === null){
                input[i].style.borderColor = "red";
                addFlash("failure", "Only use 0-9 in your phone number", "bannerFlashes", 2000);
                failure = true;
                break;
            }
        };
        phonenumber += input[i].value;//.length < || > 3, or 4?
    };
    if(failure){return false}
    else return phonenumber;
}

function register(){
    sampleBool = false;
    sampleObj = {};
    //empty out flashes
    for (var i=0; i<document.getElementsByClassName('registerInput').length; i++) {
        document.getElementsByClassName('registerInput')[i].style.borderColor = "#67d567";
    };

    //get form data
    const user = getUserInput(false, false);
    if(!user){return};
    const userConfirm = getUserInput(false, true);
    if(!userConfirm){return};
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    var returnVar = false;

    //front end validation
    if(!user){
        addFlash("registerFlash failure", "Oops, your phone number is empty");
        document.getElementById('registerUser').style.borderColor = "red";
        returnVar = true;
    };
    if(!userConfirm){
        addFlash("registerFlash failure", "Oops, your phone number confirmation is empty");
        document.getElementById('registerUserConfirm').style.borderColor = "red";
        returnVar = true;
    };
    if(!password){
        addFlash("registerFlash failure", "Oops, your password is empty");
        document.getElementById('registerPassword').style.borderColor = "red";
        returnVar = true;
    };
    if(!passwordConfirm){
        addFlash("registerFlash failure", "Oops, your password confirmation is empty");
        document.getElementById('registerPasswordConfirm').style.borderColor = "red";
        returnVar = true;
    };
    if(user !== userConfirm){
        addFlash("registerFlash failure", "Oops, your phone numbers don't match");
        document.getElementById('registerUserConfirm').style.borderColor = "red";
        returnVar = true;
    };
    if(password !== passwordConfirm){
        addFlash("registerFlash failure", "Oops, your passwords don't match");
        document.getElementById('registerPasswordConfirm').style.borderColor = "red";
        returnVar = true;
    };

    if(returnVar){return};
    
    const Data = {
        user: user,
        password: password
    }//try to combine this with login?

    const http = new XMLHttpRequest();
    http.open('POST', '/register');
    http.setRequestHeader('Content-Type', 'application/json')
    http.send(JSON.stringify(Data));
    http.onreadystatechange = () => {
        if(http.readyState === 4 && http.status === 200){
            addFlash('success', 'You are registered', 'bannerFlashes', 2000);
            binMaster = JSON.parse(http.response);
            localStorage.setItem('authToken', binMaster.authToken);
            document.getElementsByClassName('introContainer')[0].style.display = "none";
            document.getElementById('noBins').style.display = "block"
            populateSetupCables();
            buildBinsDiv(binMaster);
            updateTemperatures();
        }
        else if(http.readyState === 4 && http.status === 400){
            var errorsObj = http.response;
            errorsObj = JSON.parse(errorsObj); //test for proper response
            if(errorsObj.errors){
                errorsObj.errors.forEach((err) => {
                    addFlash('registerFlash failure', err.msg, 'bannerFlashes', 2000);
                });
            };
        }
    }//todo, get this to work with Form
}

function login(){
    sampleBool = false;
    sampleObj = {};
    for (var i=0; i<document.getElementsByClassName('loginInput').length; i++) {
        document.getElementsByClassName('loginInput')[i].style.borderColor = "#67d567";
    };
    const user = getUserInput(true);
    if(!user){return;};
    const password = document.getElementById('loginPassword').value;

    const Data = {
        user: user,
        password: password
    }

    const http = new XMLHttpRequest();
    http.open('POST', '/login');
    http.setRequestHeader('Content-Type', 'application/json')
    http.send(JSON.stringify(Data));
    http.onreadystatechange = () => {
        if(http.readyState === 4 && http.status === 200){
            addFlash('success', 'You are logged in!', 'bannerFlashes', 2000);
            binMaster = JSON.parse(http.response);
            localStorage.setItem('authToken', binMaster.authToken);
            document.getElementsByClassName('introContainer')[0].style.display = "none";
            if(binMaster.ownedCables.length === 0) document.getElementById('noBins').style.display = "block";
            populateSetupCables();
            buildBinsDiv(binMaster);
            updateTemperatures();
        }
        else if(http.readyState === 4 && http.status === 400){
            var errorsObj = http.response;
            errorsObj = JSON.parse(errorsObj); //test for proper response
            if(errorsObj.errors){
                errorsObj.errors.forEach((err) => {
                    addFlash('registerFlash failure', err.msg, 'bannerFlashes', 2000);
                });
            };
        }
    }
}

function autoLogin(){
    sampleBool = false;
    sampleObj = {};
    var authToken = localStorage.getItem('authToken');
    if(authToken){
        const Data = {authToken: authToken};
        const http = new XMLHttpRequest();
        http.open('POST', '/autoLogin');
        http.setRequestHeader('Content-Type', 'application/json')
        http.send(JSON.stringify(Data));
        http.onreadystatechange = () => {
            if(http.readyState === 4 && http.status === 200){
                binMaster = JSON.parse(http.response);
                populateSetupCables();
                buildBinsDiv(binMaster);
                updateTemperatures();
                document.getElementsByClassName('introContainer')[0].style.display = "none";
                if(binMaster.ownedCables.length === 0) document.getElementById('noBins').style.display = "block";
            }
        }
    }
    else{
        document.getElementsByClassName('introContainer')[0].style.visibility = "visible";
    }
}

function logout(){//todo, remove reload() and reset the whole cablesToSetup and dropdown deal. 
    binMaster = {};
    localStorage.setItem('authToken', '');
    location.reload();
    // document.getElementsByClassName('introContainer')[0].style.display = "block";
    // document.getElementsByClassName('introContainer')[0].style.visibility = "visible";
    // document.getElementById('noBins').style.display = "none";
    // document.getElementById('bins').innerHTML = "";
}

//ac for asynchronous chain -> this will be background scripts that start onload and prepare other parts of my site
function acPopulateStore(){
    const ul = document.getElementById('storeUl');
    ul.innerHTML = '';
    fetch('/store/populateStore')
        .then((res) => {return res.json()})
        .then((res) => {
            //set store - title in title, class on button onclick call, description below
            //products: [title, class, description];
            res.products.forEach((product) => {
                // product.title and other things
                let myInnerHtml = "<div class=\"storeTitleContainer\"><h1 class=\"storeTitle\">"+product.title+"</h1><button class=\"shoppingCartContainer\" onclick=\"buyProduct('"+product.class+"')\"><div class=\"fas fa-shopping-cart\"></div></button></div><p class=\"storeDescription\">"+product.description+"</p><hr>"
                let li = document.createElement('li');
                li.innerHTML = myInnerHtml;
                ul.appendChild(li);
            })
        })
}

function buyProduct(productClass){
    var url = "/store/buy";
    //add to frontend binMaster as well
    const authToken = localStorage.getItem('authToken');
    const Data = {
        authToken: authToken,
        productClass: productClass
    };
    const http = new XMLHttpRequest();
    http.open('POST', url);
    http.setRequestHeader('Content-Type', 'application/json')
    http.send(JSON.stringify(Data));
    http.onreadystatechange = () => {
        if(http.readyState === 4 && http.status === 200){
            binMaster.vCables.push(JSON.parse(http.response));
            let cablesNum = binMaster.vCables.length;
            document.getElementById('cablesToSetup').innerHTML = cablesNum;
            if(binMaster.ownedCables.length > 0) document.getElementById('noBins').style.display = "none";
            populateSetupCables();//wat
        }
    }
}

function setupCable(id, ...sensors){
    // id //the cable id - for removing from user, and getting bin and cable name.
    // sensors //to check for reads...

}

var flashCounter = (function count(){
    var counter = 0;
    return function(){
        return counter++;
    };
})();

//change here - add in a flash container place.
function addFlash(classString, msg, flashId="flashes", transience){
    // try to make a floating flashes under the header. with z-index of 100;
    var parent = document.getElementById(flashId);
    let counter = flashCounter();

    var flashDiv = document.createElement('div');
    flashDiv.className = ("flash" + counter + " flash " + classString);
    flashDiv.innerHTML = "<h3>" + msg + "</h3>";

    parent.appendChild(flashDiv);

    if(flashId === "flashes"){
        window.scrollTo(0, 0);
    }

    if(transience){
        setTimeout(() => {
            delMe = document.getElementsByClassName("flash" + counter)[0];
            delMe.parentNode.removeChild(delMe);

        }, transience);
    };
}

function populateSetupCables() {
    const table = document.getElementById('setupCablesDropdown');
    table.innerHTML = "<tr><th>Cable ID</th><th>Select an existing bin</th><th>Or name a new bin</th><th>Name the cable</th><th></th></tr>";
    const selectHtml = generateBinSelect();

    if(binMaster){
        binMaster.vCables.forEach((cable) => {
            let id = cable.id;
            let tr = document.createElement('tr');
            tr.className="setupCable"+id;
            tr.innerHTML = "<td>cable - "+id+"</td><td><select id=\"setupCablesBinName"+id+"\">"+selectHtml+"</select></td><td><input type=\"text\" id=\"setupCablesNewBinName"+id+"\"></td><td><input type=\"text\" id=\"setupCablesCableName"+id+"\"></td><td><button onclick=\"addCableToBins("+id+")\">Add Cable!</button></td>";
            table.appendChild(tr);
        });

        let cablesNum = binMaster.vCables.length;
        document.getElementById('cablesToSetup').innerHTML = cablesNum;
    };
}

function generateBinSelect(){
    var finishedInnerHtml = "<option value=\"none\">none</option>";
    
    if(binMaster){
        if(binMaster.bins){
            binMaster.bins.forEach((bin) => {
                let myInnerHtml = "<option value=\""+bin.bin+"\">"+bin.bin+"</option>";
                finishedInnerHtml += myInnerHtml;
            })
        }
    };

    return finishedInnerHtml;
}

function addCableToBins(id){
    if(sampleBool){
        sampleObj.addCableToBins(id);
        return;
    }
    const tr = document.getElementsByClassName("setupCable"+id)[0];
    
    var prevBin = "setupCablesBinName" + id;
    var newBin = "setupCablesNewBinName" + id;
    var cableName = "setupCablesCableName" + id;
    prevBin = document.getElementById(prevBin).value;
    newBin = document.getElementById(newBin).value;
    cableName = document.getElementById(cableName).value;

    if(prevBin !== "none"){alert("not supported yet")} //delme
    else if(newBin){
        if(!cableName){
            addFlash("failure", "No cable name supplied", "bannerFlashes", 2000);
            return;
        }
        binMaster.bins.forEach((bin) => {
            if(newBin === bin.bin){
                addFlash("failure", "That bin already exists, please choose it from the drop down menu or pick a new name", "bannerFlashes", 2000);
                return;
            }
        });
        var sensors = [];
        binMaster.vCables.forEach((cable, index) => {
            if(cable.id === id){
                sensors = cable.sensors;
                binMaster.vCables.splice(index, 1); //testMe todo delme- i would prefer this to happen in the status200 block
                let cablesNum = binMaster.vCables.length;
                document.getElementById('cablesToSetup').innerHTML = cablesNum;
            }
        });

        let bin = {
            bin: newBin,
            cables: [{
                cable: cableName,
                sensors: sensors
            }]
        }
        const Data = {
            user: binMaster.user,
            authToken: localStorage.getItem('authToken'),
            bin: bin,
            id: id
        }
        //
        const http = new XMLHttpRequest();
        http.open('POST', '/user/setupCable');//need to use authController here! todo
        http.setRequestHeader('Content-Type', 'application/json')
        http.send(JSON.stringify(Data));
        http.onreadystatechange = () => {
            if(http.readyState === 4 && http.status === 200){
                binMaster.vCables.forEach((cable, index) => {
                    if(cable.id === id){
                        binMaster.vCables.splice(index, 1); //testMe todo delme- i would prefer this to happen in the status200 block
                    }
                });
                tr.parentNode.removeChild(tr);
                var response = JSON.parse(http.response);
                var responseSensors_ids = response.sensors_ids;
                bin.cables[0].sensors = responseSensors_ids;
                binMaster.bins.push(bin);
                let binsDiv = document.getElementById('bins');
                let binCardHTML = '<div class="binHeader"><h3 class="binH3">BinName</h3><p class="binTempHighest">H</p><p>/</p><p class="binTempAverage">A</p></div><div class="binBackground"></div><div class="binCables"><h3>Cables: </h3><table class="cableTable"></table></div>';
                bin.cables[0].sensors = responseSensors_ids;
                buildABin(bin, binCardHTML, binsDiv);
                updateTemperatures();
                addFlash("success", "Bin added!", "bannerFlashes", 2000);
            }
            else if(http.readyState === 4 && http.status === 400){
                addFlash("failure", "Oops, something went wrong, please check your inputs", "bannerFlashes", 2000);
            }
            else if(http.readyState === 4 && http.status === 500){
                addFlash("failure", "Oops, something went wrong, please try again later", "bannerFlashes", 2000);
            }
            
        }
    }
    else {
        addFlash("failure", "Please select a bin or write a new name", "bannerFlashes", 2000);
        return;
    }
}