ispy.web_files = [
  "/record/600/files/BTau.ig",
  "/record/601/files/EGMonitor.ig",
  "/record/602/files/Electron.ig",
  "/record/603/files/Jet.ig",
  "/record/604/files/JetMETTauMonitor.ig",
  "/record/605/files/METFwd.ig",
  "/record/606/files/Mu.ig",
  "/record/607/files/MuMonitor.ig",
  "/record/608/files/MuOnia.ig",
  "/record/609/files/MultiJet.ig",
  "/record/610/files/Photon.ig",
  "/record/611/files/Commissioning.ig",
  "/record/612/files/MinimumBias.ig",
  "/record/613/files/ZeroBias.ig",
  "/record/300/files/4lepton.ig",
  "/record/300/files/diphoton.ig",
  "/record/301/files/dimuon-Jpsi_0.ig",
  "/record/302/files/dielectron-Jpsi_0.ig",
  "/record/303/files/dimuon_0.ig",
  "/record/304/files/dielectron_0.ig",
  "/record/305/files/dielectron-Upsilon_0.ig",
  "/record/306/files/Zee_0.ig",
  "/record/307/files/Zmumu_0.ig",
  "/record/308/files/Wenu_0.ig",
  "/record/309/files/Wmunu_0.ig"
];

ispy.ig_data = null;
ispy.ievent = 0;

ispy.openDialog = function(id) {
  $(id).modal('show');
};

ispy.closeDialog = function(id) {
  $(id).modal('hide');
};

ispy.hasFileAPI = function() {
  if ( window.FileReader ) {
    return true;
  } else {
    console.log("FileReader", window.FileReader);
    console.log("File", window.File);
    console.log("FileList", window.FileList);
    console.log("FileSystem", window.FileSystem);
    return false;
  }
};

ispy.clearTable = function(id) {
  var tbl = document.getElementById(id);
  while (tbl.rows.length > 0) {
    tbl.deleteRow(0);
  }
};

ispy.selectEvent = function(index) {
  $("#selected-event").html(ispy.event_list[index]);
  ispy.event_index = index;
  $('#load-event').removeClass('disabled');
};

ispy.updateEventList = function() {
  ispy.clearTable("browser-events");
  var tbl = document.getElementById("browser-events");

  for (var i = 0; i < ispy.event_list.length; i++) {
    var e = ispy.event_list[i];
    var row = tbl.insertRow(tbl.rows.length);
    var cell = row.insertCell(0);
    cell.innerHTML = '<a id="browser-event-' + i + '" class="event" onclick="ispy.selectEvent(\'' + i + '\');">' + e + '</a>';
  }
};

ispy.enableNextPrev = function() {
  if ( ispy.event_index > 0 ) {
    $("#prev-event-button").removeClass("disabled");
  }
  else {
    $("#prev-event-button").addClass("disabled");
  }

  if ( ispy.event_list && ispy.event_list.length - 1 > ispy.event_index ) {
    $("#next-event-button").removeClass("disabled");
  }
  else {
    $("#next-event-button").addClass("disabled");
  }
};

ispy.loadEvent = function() {
  $("#event-loaded").html("");
  $("#loading").modal("show");
  var event;

  try {
    event = JSON.parse(ispy.cleanupData(ispy.ig_data.file(ispy.event_list[ispy.event_index]).asText()));
  } catch(err) {
    alert(err);
  }

  $("#loading").modal("hide");
  ispy.addEvent(event);
  ispy.enableNextPrev();

  var ievent = +ispy.event_index + 1; // JavaScript!

  $("#event-loaded").html(ispy.file_name + ":" + ispy.event_list[ispy.event_index] + "  [" + ievent + " of " + ispy.event_list.length + "]");
};

ispy.nextEvent = function() {
  if ( ispy.event_list && ispy.event_list.length-1 > ispy.event_index ) {
    ispy.event_index++;
    ispy.loadEvent();
  }
};

ispy.prevEvent = function() {
  if ( ispy.event_list && ispy.event_index > 0) {
    ispy.event_index--;
    ispy.loadEvent();
  }
};

ispy.selectLocalFile = function(index) {
  var reader = new FileReader();
  ispy.file_name = ispy.local_files[index].name;

  reader.onload = function(e) {
    var data = e.target.result;

    require(['vendors/jszip/dist/jszip.min'], function(JSZip) {

      var zip = new JSZip(data);
      var event_list = [];

      $.each(zip.files, function(index, zipEntry){
        if ( zipEntry._data !== null && zipEntry.name !== "Header" ) {
          event_list.push(zipEntry.name);
        }
      });

      ispy.event_list = event_list;
      ispy.event_index = 0;
      ispy.updateEventList();
      ispy.ig_data = zip;
    });
  };

  reader.onerror = function(e) {
    alert(e);
  };

  reader.readAsArrayBuffer(ispy.local_files[index]);
};

ispy.updateLocalFileList = function(list) {
  ispy.clearTable("browser-files");
  var tbl = document.getElementById("browser-files");

  for (var i = 0; i < list.length; i++) {
    var name = list[i].name;
    var row = tbl.insertRow(tbl.rows.length);
    var cell = row.insertCell(0);
    var cls = "file";
    cell.innerHTML = '<a id="browser-file-' + i + '" class="' + cls + '" onclick="ispy.selectLocalFile(\'' + i + '\');">' + name + '</a>';
  }
};

ispy.loadLocalFiles = function() {
  if (!ispy.hasFileAPI()) {
    var err_msg = "Sorry. You seeem to be using a browser that does not support FileReader API. ";
    err_msg += "Please try with Chrome (6.0+), Firefox (3.6+), Safari (6.0+), or IE (10+). ";
    err_msg += "Alternatively, open a file from the web. ";
    alert(err_msg);
    return;
  }

  $('#load-event').addClass('disabled');

  ispy.clearTable("browser-files");
  ispy.clearTable("browser-events");
  $('#selected-event').html("Selected event");

  ispy.local_files = document.getElementById('local-files').files;
  ispy.updateLocalFileList(ispy.local_files);
  ispy.openDialog('#files');
};

ispy.selectFile = function(filename) {
  ispy.file_name = filename.split("/")[4];  // of course this isn't a general case for files

  $('#progress').modal('show');

  var xhr = new XMLHttpRequest();
  xhr.open("GET", filename, true);
  xhr.overrideMimeType("text/plain; charset=x-user-defined");

  ispy.clearTable("browser-events");
  var ecell = document.getElementById("browser-events").insertRow(0).insertCell(0);
  ecell.innerHTML = 'Loading events...';

  xhr.onprogress = function(evt) {
    if ( evt.lengthComputable ) {
     var percentComplete = Math.round((evt.loaded / evt.total)*100);
     $('.progress-bar').attr('style', 'width:'+percentComplete+'%;');
     $('.progress-bar').html(percentComplete+'%');
   }
 };

  xhr.onreadystatechange = function () {
    if (this.readyState === 4){
      $('#progress').modal('hide');
      $('.progress-bar').attr('style', 'width:0%;');
      $('.progress-bar').html('0%');
    }
  };

  xhr.onload = function() {
    if (this.status === 200) {

      require(['vendors/jszip/dist/jszip.min'], function(JSZip) {

        var zip = JSZip(xhr.responseText);
        var event_list = [];

        $.each(zip.files, function(index, zipEntry){
          if ( zipEntry._data !== null && zipEntry.name !== "Header" ) {
            event_list.push(zipEntry.name);
          }
        });

        ispy.event_list = event_list;
        ispy.event_index = 0;
        ispy.updateEventList();
        ispy.ig_data = zip;
      });
    }
  };

  xhr.send();
};

ispy.loadWebFiles = function() {
  ispy.clearTable("browser-files");
  ispy.clearTable("browser-events");
  $('#selected-event').html("Selected event");
  $('#load-event').addClass('disabled');

  var tbl = document.getElementById("browser-files");

  for (var i = 0; i < ispy.web_files.length; i++) {
    var e = ispy.web_files[i];
    var name = e.split("/")[4];
    var row = tbl.insertRow(tbl.rows.length);
    var cell = row.insertCell(0);
    var cls = "file";
    cell.innerHTML = '<a id="browser-file-' + i + '" class="' + cls + '" onclick="ispy.selectFile(\'' + e + '\');">' + name + '</a>';
  }
};

ispy.cleanupData = function(d) {
  // rm non-standard json bits
  // newer files will not have this problem
  d = d.replace(/\(/g,'[')
       .replace(/\)/g,']')
       .replace(/\'/g, "\"")
       .replace(/nan/g, "0");
  return d;
};
