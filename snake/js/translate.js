"use strict";

// translation a text
const translate_text = (dom, lang, text) => {
    const s = lang[text];
    if (s) {
        dom.html(s);
    }
}

// translation language
const translation = (lang) => {
    translate_text($('a#text_game'), lang, 'text_game');
    translate_text($('span#score_text'), lang, 'score_text');
    translate_text($('span#bestscore_text'), lang, 'bestscore_text');
    translate_text($('a#text_setting'), lang, 'setting');
    translate_text($('a#text_log'), lang, 'log');
    translate_text($('h4#text_ui_language'), lang, 'ui_language');
    translate_text($('h4#text_logs'), lang, 'text_logs');
    translate_text($('span#source_code'), lang, 'source_code');
    translate_text($('a#report_bugs'), lang, 'report_bugs');
    translate_text($('button#setting_save_btn'), lang, 'save');
	translate_text($('span#proudly_brought_to_you_by'), lang, 'proudly_brought_to_you_by');
    translate_text($('span#vpspromotion'), lang, 'freevps');
    translate_text($('h4#text_speed'), lang, 'text_speed');
    translate_text($('h4#text_border'), lang, 'text_border');
}

// get ui lang data
const get_lang = () => {
    const lang = $('select#lang').val();
    switch (lang) {
        case 'zh-cn': return (translation_simplified_chinese); 
        case 'en-us': return (translation_english); 
        case 'zh-tw': return (translation_traditional_chinese); 
        case 'de-de': return (translation_de_de); 
        case 'es-sp': return (translation_es_sp); 
        case 'fr-fr': return (translation_fr_fr); 
        case 'it-it': return (translation_it_it); 
        case 'ru-ru': return (translation_ru_ru); 
        case 'nl-nl': return (translation_nl_nl); 
        case 'pt-br': return (translation_pt_br); 
        case 'pl-pl': return (translation_pl_pl); 
        case 'ro-ro': return (translation_ro_ro); 
        case 'tr-tr': return (translation_tr_tr); 
    }	
}

// ui translate
const ui_translate = () => {
	const data = get_lang();
	translation(data);
}

// translate
const get_text = (x, default_text = '') => {
	const lang = get_lang();
	if (lang && lang[x]) {
		return lang[x];
	}
	return default_text;
}
