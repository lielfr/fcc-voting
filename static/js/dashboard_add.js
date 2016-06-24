function onRearrange() {
  var rowElements = $('.poll-answer');
  for (var i = 0; i < rowElements.length; i++) {
    rowElements[i].setAttribute('id', 'answer_container_' + i);
    var currentInput = rowElements[i].children[1];
    currentInput.setAttribute('name', 'poll_answer_' + i);
    currentInput.setAttribute('placeholder', 'Answer ' + (i + 1));
  }
}

function addAbove() {
  var answerContainer = $(this).parent().parent();
  constructRow().insertBefore(answerContainer);
  onRearrange();
}

function removeRow() {
  $(this).parent().parent().remove();
  onRearrange();
}

function constructRow() {
  var newContainer = $('<div>', {
    class: 'input-group poll-answer'
  });
  var addButton = $('<span>', {class: 'input-group-btn'}).append(
    $('<btn>', {
      class: 'btn btn-success btn-adda',
      type: 'button'
    }).html('Add above').click(addAbove));
  var textInput = $('<input>', {
    type: 'text',
    class: 'form-control',
    placeholder: 'Not ready yet.',
    required: true
  });
  var removeButton = $('<span>', {class: 'input-group-btn'}).append(
    $('<btn>', {
      class: 'btn btn-danger btn-remove',
      type: 'button'
    }).html('Remove').click(removeRow));
  newContainer = newContainer.append(addButton);
  newContainer = newContainer.append(textInput);
  newContainer = newContainer.append(removeButton);
  return newContainer;
}

$(document).ready(function() {
  $('.btn-adda').click(addAbove);

  $('.btn-remove').click(removeRow);

  $('.btn-add').click(function() {
    var rows = $('.poll-answer');
    var insertionPlace;
    if (rows.length > 0)
      insertionPlace = rows[rows.length - 1];
    else
      insertionPlace = $('.form-group');

    constructRow().insertAfter(insertionPlace);
    onRearrange();
  });
});
