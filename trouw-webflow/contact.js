/* =============================================================
   PRAKTIJK TROUW — CONTACT
   De zichtbare verzendknop is het component btn_light, zodat de
   rollende hover werkt. Webflow kan geen elementen in een
   verzendknop zetten, dus de echte verzendknop (.contact-form_submit) staat
   verborgen ernaast. Deze klik geeft het door.
   Alleen geladen op de contactpagina.
   ============================================================= */
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.contact-form_component .button_light');
  if (!btn) return;
  e.preventDefault();
  var form = btn.closest('form');
  if (!form) return;
  var submit = form.querySelector('.contact-form_submit');
  if (submit) submit.click();
});