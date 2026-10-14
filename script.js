const museums=[
{name:'Aga Khan Palace',address:'Pune Nagar Road, Kalyani Nagar, Pune, Maharashtra 411014',lng:73.9015957,lat:18.552267},
{name:'Peshwa Museum',address:'Parvati Hill, Parvati Paytha, Pune, Maharashtra 411009',lng:73.8470993,lat:18.4972403},
{name:'Blades of Glory Cricket Museum',address:'Sahakar Nagar, Parvati Paytha, Pune, Maharashtra 411009',lng:73.843522,lat:18.485919},
{name:"Joshi's Museum of Miniature Railways",address:'17/1 B/2, GA Kulkarni Path, Kothrud, Pune, Maharashtra 411038',lng:73.8222173,lat:18.5017439},
{name:"Symbiosis Society's Dr. Babasaheb Ambedkar Museum and Memorial",address:'Senapati Bapat Road, Pune, Maharashtra 411016',lng:73.829987,lat:18.5243149},
{name:'Mahatma Phule Museum',address:'1204/10, Ghole Road, Shivajinagar, Pune, Maharashtra 411004',lng:73.8445707,lat:18.5233701},
{name:'Raja Dinkar Kelkar Museum',address:'1377-78, Natu Baug, Shukrawar Peth, Pune, Maharashtra 411002',lng:73.8544567,lat:18.5108135},
{name:'Maharshi Karve Museum',address:'11/9A/1, Warje Malwadi Road, Karve Nagar, Pune, Maharashtra 411052',lng:73.8150573,lat:18.4882683}
];
const region=m=>m.lat>=18.52?'Northern Pune':m.lat>=18.49?'Central Pune':'Southern Pune';

// Mobile navigation
const menuBtn=document.getElementById('menuBtn'),navLinks=document.getElementById('navLinks');
menuBtn.addEventListener('click',()=>{const open=navLinks.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('.navlinks a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));

// Leaflet map
const map=L.map('map',{zoomControl:true}).setView([18.515,73.855],13);
// Satellite default. Esri's public World Imagery tile service does not require a CARTO API key.
const satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Tiles &copy; Esri'}).addTo(map);
const labels=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Esri reference'}).addTo(map);
const osm=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'});
L.control.scale({imperial:false,position:'bottomleft'}).addTo(map);

const geoserver='http://localhost:8080/geoserver/pune_gis/wms';
const buildings=L.tileLayer.wms(geoserver,{layers:'pune_gis:museum_buildings',format:'image/png',transparent:true,version:'1.1.0'}).addTo(map);
const lines=L.tileLayer.wms(geoserver,{layers:'pune_gis:museum_lines',format:'image/png',transparent:true,version:'1.1.0'}).addTo(map);
const pointWms=L.tileLayer.wms(geoserver,{layers:'pune_gis:museum_data',format:'image/png',transparent:true,version:'1.1.0'}).addTo(map);
const markerGroup=L.layerGroup().addTo(map);
const museumIcon=L.divIcon({className:'museum-marker',html:'<div class="museum-icon" aria-hidden="true">🏛️</div>',iconSize:[28,28],iconAnchor:[14,24],popupAnchor:[0,-22]});
const markerByName={};
museums.forEach(m=>{const marker=L.marker([m.lat,m.lng],{icon:museumIcon,title:m.name}).bindPopup(`<div class="popup"><h3>${m.name}</h3><p>${m.address}</p><p><strong>Coordinates:</strong> ${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}</p><span class="tag">${region(m)}</span></div>`);marker.addTo(markerGroup);markerByName[m.name]=marker});
L.control.layers({'Satellite Hybrid':satellite,'OpenStreetMap':osm},{'Place Labels':labels,'Museum Points (GeoServer)':pointWms,'Museum Locations (Interactive)':markerGroup,'Museum Connection Lines':lines,'Museum Building Polygons':buildings},{collapsed:false,position:'topright'}).addTo(map);
const bounds=L.latLngBounds(museums.map(m=>[m.lat,m.lng]));map.fitBounds(bounds.pad(.18));

const select=document.getElementById('museumSearch');museums.forEach(m=>{const o=document.createElement('option');o.value=m.name;o.textContent=m.name;select.appendChild(o)});select.addEventListener('change',()=>{const m=museums.find(x=>x.name===select.value);if(!m)return;map.setView([m.lat,m.lng],16);markerByName[m.name].openPopup()});
const tbody=document.getElementById('museumRows');museums.forEach(m=>{const tr=document.createElement('tr');tr.innerHTML=`<td><strong>${m.name}</strong></td><td>${m.address}</td><td>${m.lat.toFixed(6)}</td><td>${m.lng.toFixed(6)}</td><td>${region(m)}</td>`;tr.addEventListener('click',()=>{map.setView([m.lat,m.lng],16);markerByName[m.name].openPopup();document.getElementById('interactive-map').scrollIntoView({behavior:'smooth'})});tbody.appendChild(tr)});

const counts={'Northern Pune':0,'Central Pune':0,'Southern Pune':0};museums.forEach(m=>counts[region(m)]++);
function hav(a,b){const R=6371,rad=x=>x*Math.PI/180,dLat=rad(b.lat-a.lat),dLon=rad(b.lng-a.lng),p=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(p))}
const nearest=museums.map(m=>{let best={name:'',km:Infinity};museums.forEach(n=>{if(n===m)return;const km=hav(m,n);if(km<best.km)best={name:n.name,km}});return{museum:m.name,nearest:best.name,km:best.km}});
new Chart(document.getElementById('regionChart'),{type:'bar',data:{labels:Object.keys(counts),datasets:[{label:'Museums',data:Object.values(counts),backgroundColor:['#5b171b','#c79a43','#344a3d'],borderWidth:0,borderRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1},title:{display:true,text:'Museum count'}},x:{grid:{display:false}}}}});
new Chart(document.getElementById('distanceChart'),{type:'bar',data:{labels:nearest.map(x=>x.museum.replace(' Museum','').replace("Symbiosis Society's Dr. Babasaheb Ambedkar",'Ambedkar')),datasets:[{label:'Nearest distance (km)',data:nearest.map(x=>+x.km.toFixed(2)),backgroundColor:'#7d5a3c',borderWidth:0,borderRadius:3}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{afterLabel:c=>`Nearest: ${nearest[c.dataIndex].nearest}`}}},scales:{x:{beginAtZero:true,title:{display:true,text:'Straight-line distance (km)'}},y:{grid:{display:false}}}}});
const shortest=[...nearest].sort((a,b)=>a.km-b.km)[0],aga=nearest.find(x=>x.museum==='Aga Khan Palace');
document.getElementById('findings').innerHTML=`<li>The dataset contains <strong>${museums.length} museums</strong> across the mapped Pune study area.</li><li>The custom classification contains <strong>${counts['Northern Pune']} Northern</strong>, <strong>${counts['Central Pune']} Central</strong> and <strong>${counts['Southern Pune']} Southern</strong> museum locations.</li><li>The closest pair is <strong>${shortest.museum}</strong> and <strong>${shortest.nearest}</strong>, approximately <strong>${shortest.km.toFixed(2)} km</strong> apart.</li><li>The nearest mapped museum to <strong>Aga Khan Palace</strong> is <strong>${aga.nearest}</strong>, approximately <strong>${aga.km.toFixed(2)} km</strong> away by straight-line distance.</li><li>Connection lines visualize spatial relationships and do not represent road routes.</li>`;

// Highlight navigation link for visible section
const navAnchors=[...document.querySelectorAll('.navlinks a')];const targets=navAnchors.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){navAnchors.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}})},{rootMargin:'-35% 0px -55% 0px'});targets.forEach(t=>observer.observe(t));
