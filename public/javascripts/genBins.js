const fifteenMin = 15*60*1000;

// binMaster = {ownedCables:[], bins:[], vCables:[{sensors:["28FF8BB161170400","28FF0FAD611704FE","28FF86AD611704C6","28FFEFAC611704AB"], _id:"5c948d1f5e322225b82f594b",id:4,class:"4s-20ft-cable"}],user:"a@hotmail.com"}
var binMaster = {};
window.addEventListener("load", acPopulateStore());
window.addEventListener("load", autoLogin());
// document.getElementsByClassName("userControl")[0].addEventListener("click", logout());//for some reason this is running on load
// window.addEventListener("load", populateSetupCables());

//append user to storage api
//start using auth tokens
    //I really want to have a read authkey and a write authkey
    //I also want an ip hashing secret lookup mech
    //reset password through email
    //I suppose my javascript will need to automagically check for stored info and then log in with it
    //localStorage.setItem('authToken', authToken);
    //login and register

function buildBinsDiv(binMaster){
    const binCardHTML = '<div class="binHeader"><h3 class="binH3">BinName</h3><p class="binTempHighest">H</p><p>/</p><p class="binTempAverage">A</p></div><div class="binBackground"></div><div class="binCables"><h3>Cables: </h3><table class="cableTable"></table></div>';
    const binsDiv = document.getElementById('bins');
    binsDiv.innerHTML = '';
    if(binMaster){
        for (var i=0; i<binMaster.bins.length; i++) {
            let thisBin = binMaster.bins[i];
            //genBin
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
    genRow('th', cableTable, binMasterBin.bin, ...binMasterBin.cables);
    parentNode.appendChild(newBinCard);
}

function genRow(th, table, binName, ...cables){
    const row = document.createElement('tr');
    for (var j=0; j<cables.length; j++) {
        let cable = cables[j];
        let cell = document.createElement(th);
        cell.id = binName + '-%$&%-' + cable.cable + '-%$&%-' + (table.children.length - 1);
        th === 'th' ? cell.innerHTML = cable.cable : cell.innerHTML = '';
        row.appendChild(cell); //
    }
    table.appendChild(row);
    
    var longestCable = 0;
    for (var i=0; i<cables.length; i++) {
        if(cables[i].sensors.length > longestCable){
            longestCable = cables[i].sensors.length
        }; //todo. make more readable by moving this and longestCable out of this whole loop and declaration
    }
    if(table.children.length === (longestCable + 1)){//how to know -> if table.children.length === ...cable.length.
        return;
    }
    else {
        genRow('td', table, binName, ...cables);
    };
}

function updateTemperatures(){
    const sensorIdArray = []
    linearizeBinMaster((bin, cable, sensor, k, counter) => {
        sensorIdArray.push(sensor);
    });

    const Data = {
        sensorArray: sensorIdArray,
        authToken: localStorage.getItem('authToken')
    };

    const fetchOptions = {
        method: "POST",
        mode: "cors",
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(Data),
    }
    if(binMaster.bins.length){
        fetch('http://localhost:3000/sensorReads', fetchOptions)
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
        time = new Date(time).getTime();

        let cell = document.getElementById(bin.bin + '-%$&%-' + cable.cable + '-%$&%-' + k);
        cell.innerHTML = read/10 + '<sup>o</sup>C';

        runningTempTotal += read;
        if(read > maxTempOfBin) maxTempOfBin = read;
        if(time > mssSensorUpdate) mssSensorUpdate = time; //global var
        numberOfSensors++;


        bin.averageTemp = runningTempTotal/numberOfSensors;
        bin.maxTempOfBin = maxTempOfBin;
    });

    for (var i=0; i<binMaster.bins.length; i++) {
        const bin = binMaster.bins[i]
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
    element.innerHTML = temp/10 +'<sup>o</sup>C';
    //can add style later
}

function register(){
    //empty out flashes
    while(document.getElementsByClassName("registerFlash").length){
        let delMe = document.getElementsByClassName("registerFlash")[0];
        delMe.parentNode.removeChild(delMe);
    };
    for (var i=0; i<document.getElementsByClassName('registerInput').length; i++) {
        document.getElementsByClassName('registerInput')[i].style.borderColor = "#67d567";
    };

    //get form data
    const email = document.getElementById('registerEmail').value;
    const emailConfirm = document.getElementById('registerEmailConfirm').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    var returnVar = false;

    //front end validation
    if(!email){
        addFlash("registerFlash failure", "Oops, your email is empty");
        document.getElementById('registerEmail').style.borderColor = "red";
        returnVar = true;
    };
    if(!emailConfirm){
        addFlash("registerFlash failure", "Oops, your email confirmation is empty");
        document.getElementById('registerEmailConfirm').style.borderColor = "red";
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
    if(email !== emailConfirm){
        addFlash("registerFlash failure", "Oops, your emails don't match");
        document.getElementById('registerEmailConfirm').style.borderColor = "red";
        returnVar = true;
    };
    if(password !== passwordConfirm){
        addFlash("registerFlash failure", "Oops, your passwords don't match");
        document.getElementById('registerPasswordConfirm').style.borderColor = "red";
        returnVar = true;
    };

    if(returnVar){return};
    
    const Data = {
        email: email,
        // emailConfirm: emailConfirm,
        password: password
        // passwordConfirm: passwordConfirm
    }

    const http = new XMLHttpRequest();
    http.open('POST', 'http://localhost:3000/register');
    http.setRequestHeader('Content-Type', 'application/json')
    http.send(JSON.stringify(Data));
    http.onreadystatechange = () => {
        if(http.readyState === 4 && http.status === 200){
            addFlash('success', 'You are registered', 'bannerFlashes', 2000);
            binMaster = JSON.parse(http.response);
            binMaster.user = email;
            localStorage.setItem('authToken', binMaster.authToken);
            populateSetupCables();
            buildBinsDiv(binMaster);
            updateTemperatures();
        }
        else if(http.readyState === 4 && http.status === 400){
            var errorsObj = http.response;
            errorsObj = JSON.parse(errorsObj); //test for proper response
            if(errorsObj.errors){
                errorsObj.errors.forEach((err) => {
                    addFlash('registerFlash failure', err.msg, 'bannerFlahses', 2000);
                });
            };
        }
    }//todo, get this to work with Form
}

function login(){
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const Data = {
        email: email,
        password: password
    }

    // validate Email

    const http = new XMLHttpRequest();
    http.open('POST', 'http://localhost:3000/login');
    http.setRequestHeader('Content-Type', 'application/json')
    http.send(JSON.stringify(Data));
    http.onreadystatechange = () => {
        if(http.readyState === 4 && http.status === 200){
            addFlash('success', 'You are logged in!', 'bannerFlashes', 2000);
            binMaster = JSON.parse(http.response);
            binMaster.user = email;
            localStorage.setItem('authToken', binMaster.authToken);
            populateSetupCables();
            buildBinsDiv(binMaster);
            updateTemperatures();
        }
    }
}

function autoLogin(){//halp
    var authToken = localStorage.getItem('authToken');
    if(authToken){
        const Data = {authToken: authToken};
        const http = new XMLHttpRequest();
        http.open('POST', 'http://localhost:3000/autoLogin');
        http.setRequestHeader('Content-Type', 'application/json')
        http.send(JSON.stringify(Data));
        http.onreadystatechange = () => {
            if(http.readyState === 4 && http.status === 200){
                binMaster = JSON.parse(http.response);
                populateSetupCables();
                buildBinsDiv(binMaster);
                updateTemperatures();
                document.getElementsByClassName('introContainer')[0].style.display = "none";
            }
        }
    }
    else{
        document.getElementsByClassName('introContainer')[0].style.visibility = "visible";
    }
}

function logout(){ //get it working
    binMaster = {};
    localStorage.setItem('authToken', '');
    document.getElementsByClassName('introContainer')[0].style.display = "block";
    document.getElementsByClassName('introContainer')[0].style.visibility = "visible";
    document.getElementById('bins').innerHTML = "";
}

//ac for asynchronous chain -> this will be background scripts that start onload and prepare other parts of my site
function acPopulateStore(){
    const ul = document.getElementById('storeUl');
    ul.innerHTML = '';
    fetch('http://localhost:3000/store/populateStore')
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
    var url = "http://localhost:3000/store/buy";
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
    const tr = document.getElementsByClassName("setupCable"+id)[0];
    
    var prevBin = "setupCablesBinName" + id;
    var newBin = "setupCablesNewBinName" + id;
    var cableName = "setupCablesCableName" + id;
    prevBin = document.getElementById(prevBin).value;
    newBin = document.getElementById(newBin).value;
    cableName = document.getElementById(cableName).value;

    if(!prevBin === "none"){alert("not supported yet")} //delme
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
                binMaster.vCables.splice(index, 1); //testMe todo delme-not actually just could be buggy
            }
        });
        let bin = {
            bin: newBin,
            cables: [{
                cable: cableName,
                sensors: sensors
            }]
        }//sweet baby jesus... not sending sensors
        tr.parentNode.removeChild(tr);
        //addBinToDiv
        //update db as well
        const Data = {
            user: binMaster.user,
            authToken: localStorage.getItem('authToken'),
            bin: bin,
            id: id
        }
        //
        const http = new XMLHttpRequest();
        http.open('POST', 'http://localhost:3000/user/setupCable');//need to use authController here! todo
        http.setRequestHeader('Content-Type', 'application/json')
        http.send(JSON.stringify(Data));
        http.onreadystatechange = () => {
            if(http.readyState === 4 && http.status === 200){
                var response = JSON.parse(http.response);
                var responseSensors_ids = response.sensors_ids;
                bin.cables[0].sensors = responseSensors_ids;
                binMaster.bins.push(bin);
                let binsDiv = document.getElementById('bins');
                let binCardHTML = '<div class="binHeader"><h3 class="binH3">BinName</h3><p class="binTempHighest">H</p><p>/</p><p class="binTempAverage">A</p></div><div class="binBackground"></div><div class="binCables"><h3>Cables: </h3><table class="cableTable"></table></div>';
                bin.cables[0].sensors = responseSensors_ids;
                console.log('for addCableToBins: ');
                console.log('bin: '+ JSON.stringify(bin, null, 2));//weird weird weird. need to send
                buildABin(bin, binCardHTML, binsDiv);
                addFlash("success", "Bin added!", "bannerFlashes", 2000);//not logging.
            }
        }
    }
    else {
        addFlash("failure", "Please select a bin or write a new name", "bannerFlashes", 2000);
        return;
    }
}

