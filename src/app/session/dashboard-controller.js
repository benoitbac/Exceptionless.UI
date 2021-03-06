/* global Rickshaw:false */
(function () {
  'use strict';

  angular.module('app.session')
    .controller('session.Dashboard', function ($ExceptionlessClient, eventService, $filter, filterService, notificationService, organizationService, statService) {
      var vm = this;
      function get() {
        function optionsCallback(options) {
          options.filter += ' type:session';
          return options;
        }

        function onSuccess(response) {
          vm.stats = response.data.plain();
          if (!vm.stats.timeline) {
            vm.stats.timeline = [];
          }

          vm.chart.options.series[0].data = vm.stats.timeline.map(function (item) {
            return {x: moment.utc(item.date).unix(), y: item.numbers[1], data: item};
          });

          vm.chart.options.series[1].data = vm.stats.timeline.map(function (item) {
            return {x: moment.utc(item.date).unix(), y: item.total, data: item};
          });
        }

        return statService.getTimeline('avg:value,distinct:user.raw').then(onSuccess);
      }

      this.$onInit = function $onInit() {
        vm._source = 'app.session.Dashboard';
        vm.chart = {
          options: {
            padding: {top: 0.085},
            renderer: 'stack',
            series: [{
              name: 'Users',
              color: 'rgba(60, 116, 0, .9)',
              stroke: 'rgba(0, 0, 0, 0.15)'
            }, {
              name: 'Sessions',
              color: 'rgba(124, 194, 49, .7)',
              stroke: 'rgba(0, 0, 0, 0.15)'
            }
            ],
            stroke: true,
            unstack: true
          },
          features: {
            hover: {
              render: function (args) {
                var date = moment.unix(args.domainX);
                var formattedDate = date.hours() === 0 && date.minutes() === 0 ? date.format('ddd, MMM D, YYYY') : date.format('ddd, MMM D, YYYY h:mma');
                var content = '<div class="date">' + formattedDate + '</div>';
                args.detail.sort(function (a, b) {
                  return a.order - b.order;
                }).forEach(function (d) {
                  var swatch = '<span class="detail-swatch" style="background-color: ' + d.series.color.replace('0.5', '1') + '"></span>';
                  content += swatch + $filter('number')(d.formattedYValue) + ' ' + d.series.name + ' <br />';
                }, this);

                var xLabel = document.createElement('div');
                xLabel.className = 'x_label';
                xLabel.innerHTML = content;
                this.element.appendChild(xLabel);

                // If left-alignment results in any error, try right-alignment.
                var leftAlignError = this._calcLayoutError([xLabel]);
                if (leftAlignError > 0) {
                  xLabel.classList.remove('left');
                  xLabel.classList.add('right');

                  // If right-alignment is worse than left alignment, switch back.
                  var rightAlignError = this._calcLayoutError([xLabel]);
                  if (rightAlignError > leftAlignError) {
                    xLabel.classList.remove('right');
                    xLabel.classList.add('left');
                  }
                }

                this.show();
              }
            },
            range: {
              onSelection: function (position) {
                var start = moment.unix(position.coordMinX).utc().local();
                var end = moment.unix(position.coordMaxX).utc().local();

                filterService.setTime(start.format('YYYY-MM-DDTHH:mm:ss') + '-' + end.format('YYYY-MM-DDTHH:mm:ss'));
                $ExceptionlessClient.createFeatureUsage(vm._source + '.chart.range.onSelection')
                  .setProperty('start', start)
                  .setProperty('end', end)
                  .submit();

                return false;
              }
            },
            xAxis: {
              timeFixture: new Rickshaw.Fixtures.Time.Local(),
              overrideTimeFixtureCustomFormatters: true
            },
            yAxis: {
              ticks: 5,
              tickFormat: 'formatKMBT',
              ticksTreatment: 'glow'
            }
          }
        };

        vm.get = get;
        vm.recentSessions = {
          get: function (options) {
            return eventService.getAllSessions(options);
          },
          summary: {
            showType: false
          },
          options: {
            limit: 10,
            mode: 'summary'
          },
          source: vm._source + '.Recent',
          hideActions: true
        };
        vm.stats = {};
        get();
      };
    });
}());
