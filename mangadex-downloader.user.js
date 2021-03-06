// ==UserScript==
// @name         MangaDex Downloader
// @version      0.10
// @description  A userscript to add download-buttons to mangadex
// @author       icelord
// @homepage     https://github.com/xicelord/mangadex-scripts
// @updateURL    https://raw.githubusercontent.com/xicelord/mangadex-scripts/master/mangadex-downloader.user.js
// @downloadURL  https://raw.githubusercontent.com/xicelord/mangadex-scripts/master/mangadex-downloader.user.js
// @match        https://mangadex.org/settings
// @match        https://mangadex.org/manga/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.3/FileSaver.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM.setValue
// @grant        GM.getValue
// ==/UserScript==

(function() {
  'use strict';

  //Settings or download
  if (document.URL === 'https://mangadex.org/settings') {
    //Add tab
    $('li[role="presentation"]').last().after('<li role="presentation">' +
                                                '<a href="#download_settings" aria-controls="download_settings" role="tab" data-toggle="tab" aria-expanded="false">' +
                                                  '<span class="fas fa-download fa-fw" aria-hidden="true"></span> Download' +
                                                '</a>' +
                                              '</li>');

    //Add options
    $('#filter_settings').after('<div role="tabpanel" class="tab-pane fade" id="download_settings">' +
                                  '<div class="form-horizontal">' +
                                    '<div class="form-group">' +
                                      '<label for="file-extension" class="col-sm-3 control-label">Extension:</label>' +
                                      '<div class="col-sm-9">' +
                                        '<select class="form-control selectpicker" id="file-extension">' +
                                          '<option ' + (((localStorage.getItem("file-extension") || '.zip') === '.zip' ) ? 'selected ' : '') + 'value=".zip">.zip</option>' +
                                          '<option ' + (((localStorage.getItem("file-extension") || '.zip') === '.cbz' ) ? 'selected ' : '') + 'value=".cbz">.cbz</option>' +
                                        '</select>' +
                                      '</div>' +
                                    '</div>' +
                                    '<div class="form-group">' +
                                      '<label for="chapter-info" class="col-sm-3 control-label">Save release info:</label>' +
                                      '<div class="col-sm-9">' +
                                        '<select class="form-control selectpicker" id="chapter-info">' +
                                          '<option ' + ((localStorage.getItem("chapter-info") === '0' ) ? 'selected ' : '') + 'value="0">Disabled</option>' +
                                          '<option ' + ((localStorage.getItem("chapter-info") === '1' ) ? 'selected ' : '') + 'value="1">Text file</option>' +
                                          '<option ' + ((localStorage.getItem("chapter-info") === '2' ) ? 'selected ' : '') + 'value="2">JSON</option>' +
                                        '</select>' +
                                      '</div>' +
                                    '</div>' +
                                    '<div class="form-group">' +
                                      '<label for="parallel-downloads" class="col-sm-3 control-label">Parallel Downloads:</label>' +
                                      '<div class="col-sm-9">' +
                                        '<input type="numbers" class="form-control" id="parallel-downloads" value="' + (localStorage.getItem("parallel-downloads") || 3) + '" />' +
                                      '</div>' +
                                    '</div>' +
                                    '<div class="form-group">' +
                                      '<div class="col-sm-offset-3 col-sm-9">' +
                                        '<button type="submit" class="btn btn-default" id="save_downloader_settings"><span class="fas fa-save fa-fw" aria-hidden="true"></span> Save</button>' +
                                      '</div>' +
                                    '</div>' +
                                  '</div>' +
                                '</div>');

    //Add handler to save options
    document.getElementById('save_downloader_settings').addEventListener('click', () => {
      localStorage.setItem('file-extension', document.getElementById('file-extension').value);
      localStorage.setItem('parallel-downloads', parseInt(document.getElementById('parallel-downloads').value));
      localStorage.setItem('chapter-info', document.getElementById('chapter-info').value);
    }, false);
    return;
  }
  //Inject download-buttons
  $('tr[id^="chapter_"]').find('td:first').each((i, element) => {
    let id = $(element).find('a')[0].href.split('/').pop();

    $('<span title="Download" id="dl-' + id + '" class="fas fa-download" style="color: rgb(102, 102, 102); cursor: pointer; margin: 0px 5px;"></span>').prependTo(element);
    document.getElementById('dl-' + id).addEventListener('click', () => { downloadChapter($(element).find('a')[0].href); }, false);
  });

  let languages = {
    'Arabic': 'ara',
    'Bengali': 'ben',
    'Bulgarian': 'bul',
    'Catalan': 'cat',
    'Chinese': 'chi',
    'Czech': 'cze',
    'Danish': 'dan',
    'Dutch': 'dut',
    'English': 'eng',
    'Filipino': 'fil',
    'Finnish': 'fin',
    'French': 'fre',
    'German': 'ger',
    'Greek': 'gre',
    'Hungarian': 'hun',
    'Indonesian': 'ind',
    'Italian': 'ita',
    'Japanese': 'jpn',
    'Korean': 'kor',
    'Malaysian': 'may',
    'Mongolian': 'mon',
    'Persian': 'per',
    'Polish': 'pol',
    'Portuguese (Brazil)': 'por',
    'Portuguese (Portugal)': 'por',
    'Romanian': 'rum',
    'Russian': 'rus',
    'Serbo-Croatian': 'hrv',
    'Spanish (LATAM)': 'spa',
    'Spanish (Spain)': 'spa',
    'Swedish': 'swe',
    'Thai': 'tha',
    'Turkish': 'tur',
    'Vietnamese': 'vie'
  };

  //Function to download a chapter (called by download-buttons)
  function downloadChapter(url) {
    //Inject progressbar
    let id = url.split('/').pop();
    let link = $('a[href="/chapter/' + id + '"]');
    let chapter = link.data('chapterNum');
    let volume = link.data('volumeNum');
    let title = link.data('chapterName');
    let group = link.parent().parent()[0].querySelector('td:nth-child(3) > a').innerText;
    let mangatitle = $('.panel-title')[0].innerText.trim();
    let language = link.parent().parent()[0].querySelector('td:nth-child(2) > img').title;
    let language_iso = languages[language];
    $('<div id="progress-out-' + id + '" style="width: 100%; margin-bottom: 2px; background-color: grey;"><div id="progress-in-' + id + '" style="width: 0%; height: 5px; background-color: green;"></div></div>').insertBefore($('#dl-' + id));

    //Fetch page-urls and download them
    getPageUrls(url, (err, page_urls) => {
      if (err) {
        alert('The page-urls could not be fetched. Check the console for more details.');
        setProgress(id, -1);
        console.log(err);
      } else {
        //Fetch all pages using JSZip
        let zip = new JSZip();
        let zipFilename = mangatitle + (language_iso == "eng" ? "" : " [" + language_iso + "]") + " - c" + (chapter < 100 ? chapter < 10 ? '00' + chapter : '0' + chapter : chapter) + (volume ? " (v" + (volume < 10 ? '0' + volume : volume) + ")" : "") + " [" + group + "]" + (localStorage.getItem("file-extension") || '.zip');
        let page_count = page_urls.length;
        let active_downloads = 0;
        let failed = false;

        if (localStorage.getItem("chapter-info") == '1') {
          let chapterInfo = mangatitle + '\n';
          chapterInfo += $('.panel-heading + div tr:first-child td').text().trim() === '' ? '' : $('.panel-heading + div tr:first-child td').text() + '\n';
          chapterInfo += url + '\n\n';
          chapterInfo += 'Chapter: ' + chapter + '\n';
          if(volume) chapterInfo += 'Volume: ' + volume + '\n';
          chapterInfo += 'Title: ' + title + '\n';
          chapterInfo += 'Group: ' + group + '\n\n';
          chapterInfo += 'Genres: ' + $('.panel-heading + div tr:nth-child(4) td').text().trim().replace(/ /g, ', ') + '\n';
          chapterInfo += 'Uploader: ' + link.parent().parent().find('td:nth-child(4)').text() + ' (' + link.parent().parent().find('td:nth-child(4) > a').attr('href').replace(/\/user\//, '') + ')' + '\n';
          chapterInfo += 'Posted: ' + link.parent().parent().find('td:last-child')[0].title + '\n';
          chapterInfo += 'Language: ' + language + (language === $('.panel-title > img')[0].title ? '' : '  TR') + '\n';
          chapterInfo += 'Length: ' + page_count + ' page' + (page_urls.length > 1 ? 's' : '') + '\n\n\n\n';
          page_urls.forEach(function(url, index){
            chapterInfo += 'Image ' + (index + 1) + ': ' + url.replace(/^\//, location.protocol + '//' + location.hostname + '/') + '\n';
          });
          chapterInfo += '\nDownloaded at ' + new Date() + '\n\n';
          chapterInfo += 'Generated by MangaDex Downloader. https://github.com/xicelord/mangadex-scripts';
          zip.file('info.txt', chapterInfo.replace(/\n/gi, '\r\n'));
        } else if (localStorage.getItem("chapter-info") == '2') {
          if(!volume) volume = null;
          const chapterInfo = {
            manga: mangatitle,
            altnames: $('.panel-heading + div tr:first-child td').text().split(', '),
            link: url,
            chapter: chapter,
            volume: volume,
            title: title,
            group: group,
            genres: $('.panel-heading + div tr:nth-child(4) td').text().trim().split(' '),
            uploader: {
              id: parseInt(link.parent().parent().find('td:nth-child(4) > a').attr('href').replace(/\/user\//, '')),
              username: link.parent().parent().find('td:nth-child(4)').text()
            },
            posted: link.parent().parent().find('td:last-child')[0].title,
            language: language,
            translated: (language !== $('.panel-title > img')[0].title),
            images: []
          };
          page_urls.forEach(function(url){
            chapterInfo.images.push(url.replace(/^\//, location.protocol + '//' + location.hostname + '/'));
          });
          zip.file('info.json', JSON.stringify(chapterInfo, null, 4));
        }

        let interval = setInterval(() => {
          if (active_downloads < (localStorage.getItem("parallel-downloads") || 3) && page_urls.length > 0) {
            let to_download = page_urls.shift();
            let current_page = page_count - page_urls.length;

            active_downloads++;
            GM_xmlhttpRequest({
              method:   'GET',
              url:      to_download,
              responseType: 'arraybuffer',
              onload:   function (data) {
                zip.file(mangatitle + (language_iso == "eng" ? "" : " [" + language_iso + "]") + " - c" + (chapter < 100 ? chapter < 10 ? '00' + chapter : '0' + chapter : chapter) + (volume ? " (v" + (volume < 10 ? '0' + volume : volume) + ")" : "") + " - p" + (current_page < 100 ? current_page < 10 ? '00' + current_page : '0' + current_page : current_page) + " [" + group + "]" +  '.' + to_download.split('.').pop(), data.response, { binary: true });
                if (!failed) { setProgress(id, ((page_count -page_urls.length) /page_count) * 100); }
                active_downloads--;
              },
              onerror:  function (data) {
                alert('A page-download failed. Check the console for more details.');
                console.log(data);
                clearInterval(interval);
                setProgress(id, -1);
              }
            });
          } else if (active_downloads === 0 && page_urls.length === 0) {
            clearInterval(interval);
            zip.generateAsync({ type: "blob" }).then((zipFile) => {
              saveAs(zipFile, zipFilename);
              setProgress(id, -1);
            });
          }
        }, 500);
      }
    });
  }

  //Get all page-urls of chapter
  function getPageUrls(url, cb) {
    $.get(url, (data) => {
      try {
        let server = data.match(/var server = \'(.+)\';/)[1];
        let dataurl = data.match(/var dataurl = \'(.+)\';/)[1];

        let str_page_array = data.match(/var page_array = \[\r\n(.+)\];/)[1];
        if (str_page_array.endsWith(',')) { str_page_array = str_page_array.slice(0,-1); }
        str_page_array = replaceAll(str_page_array, '\'', '"');
        let page_array = JSON.parse('[' + str_page_array + ']');

        let urls = [];
        if (Array.isArray(page_array)) {
          for (let i = 0; i < page_array.length; i++) {
            urls.push(server + dataurl + '/' + page_array[i]);
          }
        }

        cb(null, urls);
      } catch (ex) {
        cb(ex, null);
      }
    }).fail((jqXHR, textStatus, error) => {
      cb({ textStatus: textStatus, error: error }, null);
    });
  }

  //Set progress of download for id
  function setProgress(id, progress) {
    if (progress !== -1) {
      $('#progress-in-' + id).width(progress + '%');
    } else {
      $('#progress-in-' + id).remove();
    }
  }

  //Helper-functions
  function replaceAll(str, search, replacement) {
    return str.split(search).join(replacement);
  }
})();
