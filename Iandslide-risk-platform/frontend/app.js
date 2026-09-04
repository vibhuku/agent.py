const locations={
  cherrapunji:{name:'Cherrapunji',region:'East Khasi Hills, Meghalaya',code:'MEG',score:64,level:'Moderate',rainfall:'86 mm',status:'Conditions need attention today.'},
  guwahati:{name:'Guwahati',region:'Kamrup, Assam',code:'ASM',score:27,level:'Low',rainfall:'32 mm',status:'Conditions are stable today.'},
  kohima:{name:'Kohima',region:'Kohima, Nagaland',code:'NAG',score:78,level:'High',rainfall:'142 mm',status:'Immediate caution is advised.'},
  tawang:{name:'Tawang',region:'Tawang, Arunachal Pradesh',code:'ARP',score:71,level:'High',rainfall:'118 mm',status:'Slope instability is elevated.'}
};
const searchInput=document.querySelector('#location-search');
const mapPins=document.querySelectorAll('.map-pin');

function selectLocation(location){
  document.querySelector('#selected-location').textContent=location.name;
  document.querySelector('#selected-location').nextElementSibling.textContent=location.region;
  document.querySelector('.pin-badge').textContent=location.code;
  document.querySelector('#location-score').textContent=location.score;
  document.querySelector('#location-level').textContent=`${location.level} risk`;
  document.querySelector('#location-level').className=`risk-chip ${location.level==='High'?'high':'moderate'}-chip`;
  document.querySelector('#location-status').textContent=location.status;
  document.querySelector('#location-rainfall').textContent=location.rainfall;
}

document.querySelector('#search-button').addEventListener('click',()=>{
  const query=searchInput.value.trim().toLowerCase();
  const match=Object.values(locations).find(location=>`${location.name} ${location.region}`.toLowerCase().includes(query));
  if(match) selectLocation(match); else searchInput.setCustomValidity('No matching monitored location found.');
  searchInput.reportValidity();
  if(match) searchInput.setCustomValidity('');
});
searchInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();document.querySelector('#search-button').click();}});
mapPins.forEach((pin,index)=>pin.addEventListener('click',()=>selectLocation(Object.values(locations)[[3,0,2,1][index]])));
document.querySelector('#layer-button').addEventListener('click',event=>{const active=event.currentTarget.dataset.active==='true';event.currentTarget.dataset.active=String(!active);event.currentTarget.firstChild.textContent=active?'Risk level ':'Rainfall layer ';});
document.querySelector('#details-button').addEventListener('click',()=>document.querySelector('#insights').scrollIntoView({behavior:'smooth'}));

const modal=document.querySelector('#report-modal');
const toggleModal=open=>{modal.classList.toggle('open',open);modal.setAttribute('aria-hidden',String(!open));if(open)modal.querySelector('input').focus();};
document.querySelector('#report-open').addEventListener('click',()=>toggleModal(true));
document.querySelector('#report-close').addEventListener('click',()=>toggleModal(false));
modal.querySelector('[data-close-modal]').addEventListener('click',()=>toggleModal(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape')toggleModal(false);});
document.querySelector('#report-form').addEventListener('submit',event=>{event.preventDefault();event.currentTarget.style.display='none';document.querySelector('#form-success').classList.add('visible');});
document.querySelector('#menu-toggle').addEventListener('click',()=>document.querySelector('.main-nav').classList.toggle('mobile-open'));
