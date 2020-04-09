import React, {useState, useEffect} from 'react';
import Firebase from 'firebase';
import {PageView, initGA} from './Tracking';
import {MapLayer} from './MapLayer.js';
import {CityDetailView} from './CityDetailView.js';

//import {SubmitForm} from './SubmitForm.js';
//import {IntroScreen} from './IntroScreen';
//import {About} from './About'
import {SecNav} from './SecNav.js'
import './CSS/App.css'


function get_filter(datajson,searchkey){
  var datajson2={"locations":{},totalBlocks:0}
  Object.keys(datajson.locations).forEach(function(key){
    datajson2.locations[key]={"blocks":[], "coordinates":datajson.locations[key].coordinates}
    datajson2.locations[key].blocks = datajson.locations[key].blocks.filter(function(item){
      return item.textsearch.includes(searchkey)
    })
  })
  var count=0
  Object.keys(datajson2.locations).forEach(function(state){
    count=count+datajson2.locations[state].blocks.length
    if(datajson2.locations[state].blocks.length==0){
      delete datajson2.locations[state]
    }
  })
  datajson2.totalBlocks=count
  return datajson2
}


const fetchJSON = async() => {
  const res = await fetch('/getBlockData');
  const body = await res.json();
  if(res.status !== 200) throw Error(body.message)
  return body;
}

const config = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
}

function App() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [videoData, setVideoData] = useState({});
  const [totalCities, setTotalCities] = useState([]);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const desktopSize = 1024;
  const [searchQuery,setSearchQuery] = useState("");
  const [result, setResult] = useState({});
  useEffect(()=> {
    Firebase.initializeApp(config);
    initGA(process.env.REACT_APP_GA_TRACKING_ID);
    PageView('Intro')
    fetchJSON()
      .then(res => {
        setVideoData(res.locations);
        setResult(res)

        let citiesArray = Object.keys(res.locations);
        let urlLocation = window.location.href
        let hashCity = urlLocation.split('#')[1];
        if(hashCity !== undefined && hashCity.length>1) {
          let formattedHashCity = hashCity.charAt(0).toUpperCase() + hashCity.slice(1);
          if(citiesArray.indexOf(formattedHashCity) !== -1) {
            setSelectedCity(formattedHashCity);
          }
        }
        setTotalCities(citiesArray);
      })
      .catch(err => console.log(err))
  },[])

  const onNewLinkSubmit = (newData) => {
    let newPostKey = Firebase.database().ref('/').push();
    newPostKey.set(newData);
  }

  const onMarkerClick = (e, city) => {
    e.preventDefault();
    if(city){window.location.hash = city; window.scrollTo({top: 0, left: 0, behavior: 'smooth'})}
    else{window.location.hash = ""}
    if(selectedCity !== city) {
      setSelectedCity(city);
    }
  }

  const onCityDetailClose = (e) => {
    e && e.preventDefault();
    setSelectedCity(null)
  }

  const handleAboutClicked = () => {
    window.location.hash = "about"
    setIsAboutOpen(true);
  }

  const handleAboutClose = () => {
    window.location.hash = "/"
    setIsAboutOpen(false);
  }

  //const onChangeSearch = query => setVideoData(videoData);
  const onChangeSearch = item => {
    console.log(item.target.value)
    var filterresult=get_filter(result,item.target.value)
    setVideoData(filterresult.locations)
    setTotalCities(Object.keys(filterresult.locations))
    setSelectedCity(null)
    console.log(videoData)
  }

  return (
    <div className="app">
      <div className="searchbar">
      <form>
        Search by text: <input type="text" name="searchQuery" onChange={onChangeSearch.bind(searchQuery)}></input>
      </form>
      </div>
      <SecNav handleAboutClicked = {handleAboutClicked}/>
      <MapLayer className="mapLayer" onMarkerClick={onMarkerClick} videoData={videoData} totalCities={totalCities} desktopSize={desktopSize}/>
      {selectedCity && <CityDetailView selectedCity={selectedCity} videoData={videoData} onCityDetailClose={onCityDetailClose} desktopSize={desktopSize} />}
      </div>)
}

export default App;
