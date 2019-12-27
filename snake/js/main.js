"use strict";

const manifest = chrome.runtime.getManifest();
const app_name = manifest.name + " v" + manifest.version;
let bestscore = 0;

function getChromeVersion() {     
	var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
	return raw ? parseInt(raw[2], 10) : false;
}

// save settings
const saveSettings = (showMsg = true) => {
    let settings = {};
    settings['lang'] = $('select#lang').val();
    settings['bestscore'] = bestscore;
    chrome.storage.sync.set({ 
        snake_game_settings: settings
    }, function() {
        if (showMsg) {
            alert(get_text('alert_save'));
        }
    });
};

document.addEventListener('DOMContentLoaded', function() {
    // init tabs
    $(function() {   
        $( "#tabs" ).tabs();
    });    
    let about = $('textarea#about');
    about.html('App: ' + app_name + '\nChrome Version: ' + getChromeVersion() + "\n");

    // load settings
    chrome.storage.sync.get('snake_game_settings', function(data) {
        if (data && data.snake_game_settings) {
            const settings = data.snake_game_settings;
            const lang = settings['lang'];
            if (settings['bestscore']) {
                bestscore = settings['bestscore'];
            }
            $("select#lang").val(lang);
        } else {
            // first time set default parameters
        }
        // about
        // version number
        $('textarea#about').val(get_text('application') + ': ' + app_name + '\n' + get_text('chrome_version') + ': ' + getChromeVersion());

        // translate
        ui_translate();
        windowload();
    });   
    
    // save settings when button 'save' is clicked
    $('button#setting_save_btn').click(function() {
        saveSettings();
        // translate
        ui_translate();        
    });         
}, false);
