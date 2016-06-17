$(document).ready(function() {
  $('button.list-group-item').click(function() {
    if ($('#new-answer').val() === '')
      $('#selected-answer').val($(this).text());
    else
      $('#selected-answer').val('');
  });

  $('#new-answer').change(function() {
    if ($(this).val() !== '' && $('#selected-answer').val() !== '')
      $('#selected-answer').val('');
  });
});
