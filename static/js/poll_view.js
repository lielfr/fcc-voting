$(document).ready(function() {
  var canvas = $('#results-chart');
  $.get('raw/', function(data) {
    var pollChart = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              stepSize: 1
            }
          }]
        }
      }
    });
  });
});
