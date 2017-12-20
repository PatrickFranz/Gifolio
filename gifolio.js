'use strict';

const DB_NAME = 'albumDB';
const DB_STORE = 'giphy';
const GIPHY_KEY = 'aztvTqhsjw8Z7b2QFXf7t2ZDxYY4qSLG';
const GIPHY_URL = 'http://api.giphy.com/v1/gifs/'; //http://api.giphy.com/v1/gifs/search?q=funny+cat&api_key=
const DB_VERSION = 1;
const EL_searchBtn  = document.getElementById('submit');
const EL_gifGrid = document.getElementById('gif-grid');
const EL_faveBtn = document.getElementById('fave-btn');
const EL_faveTitle = document.getElementById('fave-title');
let db = getDb();
let faveIds =[];


if(EL_searchBtn){
  EL_searchBtn.addEventListener('click', e => {
    EL_faveTitle.style.display = 'none';
    getGiphys(document.getElementById('query').value);
  });
}

document.getElementById('query').addEventListener('keydown', e => {
  let key = e.which  || e.keyCode;
  if(key === 13){
    EL_searchBtn.click();
  }
});

EL_faveBtn.addEventListener('click', e => {
  showFaves();
  EL_faveTitle.style.display = 'initial';
});

function getDb(store=DB_STORE){
  if('indexedDB' in window){
    const openReq = indexedDB.open(DB_NAME, DB_VERSION);

    openReq.onupgradeneeded = event => {
      db = event.target.result,
      db.createObjectStore(DB_STORE, {keyPath:'id'});
    };

    openReq.onsuccess = event => {
      db = event.target.result;
      dbGetFaveIds();
    };

    openReq.onerror = event => {
      console.log(event.target.errorCode);
    };

  } else {
    console.log("Please update your browser!");
  }
}

function dbPut(obj){
  const store = db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE);
  if(!faveIds.includes(obj.id)){
    const putReq = store.put(obj);
    putReq.onsuccess = function(evt){
      console.log("Added!", evt);
    }
  }
}

function dbGetAll(callback){
  const store = db.transaction(DB_STORE).objectStore(DB_STORE);
  const getReq = store.getAll();
  getReq.onsuccess = function(evt){
    callback(evt);
  }
}

function dbGetFaveIds(){
  const ids = dbGetAll(function(evt){
    const faves = evt.target.result;
    faves.forEach(function(el){
      faveIds.push(el.id);
    });
  });
}

function dbGet(id){}

function dbRemove(obj){
  const store = db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE);
  const removeReq = store.delete(obj.id);
  removeReq.onsuccess = function(evt){
    console.log('Removed! ');
  }
}

function getGiphys(searchString){
  const xhr = new XMLHttpRequest(),
        openString = `${GIPHY_URL}search?q=${searchString}&api_key=${GIPHY_KEY}`;
  xhr.open('GET', openString);
  xhr.send();

  xhr.onload = function(){
    showGifs(xhr.response);
  }
}

function showFaves(){
  dbGetAll(function(evt){
    showGifs(evt.target.result);
  });
}

function showGifs(json){
  let gifs;
  if(typeof(json) !== typeof([])){
    gifs = JSON.parse(json).data;
  } else {
    gifs = json;
  }

  EL_gifGrid.innerHTML = "";
  for(let i in gifs){
    let currentEl = (document.getElementById('gif-grid')
      .appendChild(createGifElement(gifs[i])));
    if(faveIds.includes(gifs[i].id)){
      currentEl.firstChild.firstChild.setAttribute('data-isFave', true);
    }
    
    currentEl.addEventListener('click', evt =>{
      const thisGif = gifs[i];
      if(evt.target.nodeName === 'IMG'){
        if(evt.target.dataset.isfave === 'true'){
          evt.target.setAttribute('data-isFave', false);
          dbRemove(thisGif);
        } else {
          evt.target.setAttribute('data-isFave', true);
          dbPut(thisGif);
        }
        redraw();
      }
    });
  }
  redraw();
}

function redraw(){
  const allElements = [].slice.call(document.getElementsByClassName('gif-grid-element'));
  allElements.forEach(function(element) {
    if(element.firstChild.firstChild.dataset.isfave === 'true'){
      element.firstChild.lastChild.style.display = 'inline';
    } else {
      element.firstChild.lastChild.style.display = '';
    }
  }, this);
}

function createGifElement(gifObj){
  const divContainer = document.createElement('div');
    divContainer.className = "gif-grid-element"
    const lblContainer = document.createElement("label");
          lblContainer.setAttribute('for', gifObj.id);
      const gifImage = document.createElement('img');
            gifImage.src = gifObj.images.original.url;
            gifImage.setAttribute('data-id', gifObj.id);    
      const faveOverlay = document.createElement('img');
            faveOverlay.src = 'img/heart-2_960_720.png';
            faveOverlay.className = "favorite";
  
  lblContainer.appendChild(gifImage);
  lblContainer.appendChild(faveOverlay);
  divContainer.appendChild(lblContainer);
  return divContainer;
}

