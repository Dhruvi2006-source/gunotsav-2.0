// School details page controller
async function initializePage() {
  if (!SCHOOL) return;

  $('mName').value = SCHOOL.name || '';
  $('mUdise').value = SCHOOL.udise || '';
  $('mYear').value = SCHOOL.year || '';
  $('mVillage').value = SCHOOL.village || '';
  $('mTaluka').value = SCHOOL.taluka || '';
  $('mDistrict').value = SCHOOL.district || '';
  $('mPrincipal').value = SCHOOL.principal || '';
  $('mMobile').value = SCHOOL.mobile || '';
}

async function saveSchoolInfo() {
  const updatedSchool = {
    udise: $('mUdise').value.trim(),
    name: $('mName').value.trim(),
    year: $('mYear').value.trim(),
    village: $('mVillage').value.trim(),
    taluka: $('mTaluka').value.trim(),
    district: $('mDistrict').value.trim(),
    principal: $('mPrincipal').value.trim(),
    mobile: $('mMobile').value.trim()
  };

  if (!updatedSchool.udise || !updatedSchool.name || !updatedSchool.year) {
    alert("કૃપા કરીને શાળાનું નામ, UDISE કોડ અને શૈક્ષણિક વર્ષ દાખલ કરો.");
    return;
  }

  showStatus('💾 સેવ થઈ રહ્યું છે...', true, 0);

  try {
    const result = await API.saveSchool(updatedSchool);
    if (result.success) {
      const oldUdise = SCHOOL ? SCHOOL.udise : '';
      SCHOOL = result.school;
      localStorage.setItem('gunotsav_selected_udise', SCHOOL.udise);
      
      updateHeaderUI();
      showStatus('✅ શાળાની માહિતી સફળતાપૂર્વક સેવ થઈ!', true);

      // If UDISE changed, reload the page to refresh context
      if (oldUdise && oldUdise !== SCHOOL.udise) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
      }
    } else {
      showStatus('❌ સાચવવું અસફળ રહ્યું: ' + result.message, false);
    }
  } catch (error) {
    console.error('SaveSchoolInfo Error:', error);
    showStatus('❌ સર્વર કનેક્શન ભૂલ!', false);
  }
}

async function resetAllDataConfirm() {
  if (!SCHOOL || !SCHOOL._id) {
    alert('શાળાની માહિતી લોડ થયેલ નથી.');
    return;
  }

  if (confirm("શું તમે ખરેખર બધી માહિતી મૂળ ડિફોલ્ટ સ્થિતિમાં રીસેટ કરવા માંગો છો? તમારા સાચવેલા રિપોર્ટ અને બિડાણ દસ્તાવેજો સર્વર પરથી સંપૂર્ણપણે દૂર થશે.")) {
    showStatus('⚡ ડેટા રીસેટ થઈ રહ્યો છે...', false, 0);
    
    try {
      const result = await API.resetSchoolData(SCHOOL._id);
      if (result.success) {
        showStatus('✅ તમામ ડેટા સફળતાપૂર્વક રીસેટ થયો!', true);
        alert("તમામ ડેટા સફળતાપૂર્વક રીસેટ થયો છે.");
        window.location.href = '/index.html';
      } else {
        showStatus("રીસેટ અસફળ: " + result.message, false);
      }
    } catch (error) {
      console.error('Reset Data Error:', error);
      showStatus("રીસેટ કરવામાં ક્ષતિ આવી છે.", false);
    }
  }
}
