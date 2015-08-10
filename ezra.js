$(document).ready(function(){

  var fileX = {};
  var sel1 = -1;
  var sel2 = -1;
  var myFiles = [];
  var fileID = {};
  var links;

  var currentChain = [];

  reset();
  dataGraph(myFiles);


  $('.link').hover(function() {
    $(this).css('cursor','pointer');
  });
  $('.node').hover(function() {
    $(this).css('cursor','pointer');
  });
  $('.datatext').hover(function() {
    $(this).css('cursor','pointer');
  });

  $('#reverse').click(function() {
    var newChain = [];
    for (var i=currentChain.length-1;i>=0;i--) {
      newChain.push([currentChain[i][1],currentChain[i][0]]);
    }
    currentChain = newChain;
    if (currentChain.length !== 0) {
      var d = createDataFor(currentChain);
      fillData(d);
      var chainHead = currentChain[0];
      var chainTail = currentChain[currentChain.length-1];
      purePlot(d,chainTail[1] + ' as a function of ' + chainHead[0],chainHead[0],chainTail[1]);
    } else {
      $('#plot').html('No Data');
      $('#data').html('No Data');
    }
  });

  //$('#analyze').click(function() {
  function doIt() {
    var v = $('#analyze_text').val().toUpperCase().replace(/ /g,'');
    $('#process_text').html('Starting...');
    var m = v.split(',');
    var n = findRoute(m[0],m[1]);
    showMe('<br>Route: ' + n);
    var d = createAppropriate(n);
    var dd = createNewData(d);
    var chars = n.split(',');
    var from = chars[0];
    var to = chars[chars.length-1];
    var name = to + ' as a function of ' + from;
    purePlot(dd,name,from,to);
    fillData(dd);
  }//);

  function findRoute(start,end) {
    var aPairs = [];
    var aLetters = [];
    _.each(myFiles,function(file) {
      aPairs.push(file.columnNames);
      aLetters.push(file.columnNames[0]);
      aLetters.push(file.columnNames[1]);
    });
    aLetters = _.uniq(aLetters);
    aLetters = _.without(aLetters,start,end);
    // If [start,end] is an allowed pair then we're done.
    var result = '';
    _.each(aPairs,function(v) {
      if ((v[0] === start) && (v[1] === end)) {
        result = start+','+end;
      }
      if ((v[1] === start) && (v[0] === end)) {
        result = start+','+end;
      }
    });
    if (result !== '') {
      return result;
    }

    // If not then try all [start,X1,end] where X1 is any allowed letter other than start,end.

    for (var i=1;i<aLetters.length && result==='';i++) {
      _.each(permuten(aLetters,i),function(middle) {
        if (createAppropriate(start+','+middle+','+end) !== false) {
          result = start+','+middle+','+end;
          return false; // Gets us out of the _.each.
        } else {
          return true;
        }
      });
    }

    return result;
    // If not then try all [start,X1,X2,end] where X2 are any allowed letters other than start,end.

  }

  function permuten(array,n) {
    if (n === 0) {
      return [[]];
    }
    var r = [];
    _.each(array,function(item) {
      var rest = permuten(_.without(array,item),n-1);
      _.each(rest,function(ar) {
        r.push(_.union([item],ar));
      });
    });
    return r;
  }

  function generateData() {
    var file0 = {fileName: 'file0',columnNames: ['TIME','VISITS'],data: []};
    var file1 = {fileName: 'file1',columnNames: ['VISITS','SALES'],data: []};
    var file2 = {fileName: 'file2',columnNames: ['SALES','PROFIT'],data: []};
    var file3 = {fileName: 'file3',columnNames: ['PROFIT','HAPPINESS'],data: []};
    var file4 = {fileName: 'file4',columnNames: ['HAPPINESS','SALES'],data: []};
    var file5 = {fileName: 'file5',columnNames: ['VISITS','REVISITS'],data:[]};

    for (var i=1;i<=100;i+=5) {
      var a = i;
      var b = round(10*Math.sin(a/10));
      var c = round(b + Math.floor(Math.random() * 7)-3);
      var d = round(Math.log(a+Math.random()*7));
      var e = round(100-c+Math.random()*5-3);
      var f = round(Math.pow(b,2)+Math.random()*5-3);
      var g = round(0.5*b+Math.random()*4-2);
      file0.data.push([a,b]);
      file1.data.push([b,c]);
      file2.data.push([c,d]);
      file3.data.push([d,e]);
      file4.data.push([f,c]);
      file5.data.push([b,g]);
    }
    return [file0,file1,file2,file3,file4,file5];
  }

  function round(x) {
    return Math.round(x*100)/100;
  }

  function reset() {
    myFiles = generateData();
    fileID = {};
    sel1 = -1;
    sel2 = -1;
    fileX = {};

    //$('#files').html('');
    _.each(myFiles,function(fileData,i) {
      fileID[fileData.fileName] = i;
      var c = '[' + fileData.columnNames[0] + ',' + fileData.columnNames[1] + ']';
      //var d = '<div style="margin:5px;">' + c + '</div>';
      //$('#files').append(d);
    });

    $('#plot').html('No Data');
    $('#data').html('No Data');

  }

  function showMe(text) {
    $('#process_text').append(text);
  }

  // Create data for a chain:
  // [[a,b],[b,c],[c,d]]

  function createDataFor(chain) {
    var data = [];
    _.each(chain,function(link) {
      // Find the data for this link.
      _.each(myFiles,function(file) {
        if ((file.columnNames[0] === link[0]) && (file.columnNames[1] === link[1])) {
          data.push(file.data.sort(function(a,b) {return a[0]-b[0];}));
        }
        if ((file.columnNames[0] === link[1]) && (file.columnNames[1] === link[0])) {
          data.push(flip(file.data).sort(function(a,b) {return a[0]-b[0];}));
        }
      });
    });
    return createNewData(data);
  }

  // Look through myFiles and find data which will appropriately
  // represent the string of letters in chain.
  function createAppropriate(chain) {
    var goodChain = [];
    var ch = chain.split(',');
    if (ch.length < 2) {
      return false;
    }
    var success = true;
    for (var i=0;i<ch.length-1;i++) {
      var c1 = ch[i];
      var c2 = ch[i+1];
      var found = false;
      for (var d=0;d<myFiles.length;d++) {
        if ((c1 === myFiles[d].columnNames[0]) && (c2 === myFiles[d].columnNames[1])) {
          goodChain.push(myFiles[d].data.sort(function(a,b) {return a[0]-b[0];}));
          found = true;
          break;
        }
        if ((c1 === myFiles[d].columnNames[1]) && (c2 === myFiles[d].columnNames[0])) {
          goodChain.push(flip(myFiles[d].data).sort(function(a,b) {return a[0]-b[0];}));
          found = true;
          break;
        }
      }
      if (!found) {
        success = false;
        break;
      }
    }
    if (success) {
      return goodChain;
    } else {
      return false;
    }
  }

  function flip(data) {
    var newData = [];
    _.each(data,function(point) {
      newData.push([point[1],point[0]]);
    });
    return newData;
  }

  // The following function assumes that data=[data_1,data_2,...,data_n] is a set
  // of pairs, meaning each data_i is an array of [x,y] with x in increasing
  // order.  It then returns a set of points [x,y] which links the
  // x-values from data1 to the y-values from data_n

  function createNewData(data) {
    if (data.length === 1) {
      return data[0];
    } else if (data.length > 2) {
      return createNewData([data[0],createNewData(_.rest(data))]);
    } else {
      var data1 = data[0];
      var data2 = data[1];
      //console.table(data1);
      //console.table(data2);


      var newData = [];
      _.each(data1,function(datum) {
        var x = datum[0];
        var y = datum[1];
        // Try interpolation.
        // If y is between two x's of newData2 then we can interpolate.
        // We find the index of the first larger one.
        var w = _.findIndex(data2,function(point) {
          return point[0] > y;
        });
        // The cases are thus:
        // w = 0  : The first one is larger, meaning that we're smaller than all the x-values in newData2.
        // w = -1 : The last one is not larger, meaning we're larger than all the x-values in newData2.
        // w > 0 : We've got a first larger such that the previous is the last smaller.  INTERPOLATE.
        var first = 0;
        var second = 0;
        if (w > 0) {
          first = w-1;
          second = w;
        } else if (w === 0) {
          first = 0;
          second = 1;
        } else if (w === -1) {
          first = data2.length-2;
          second = data2.length-1;
        }

        var x1 = data2[first][0];
        var y1 = data2[first][1];
        var x2 = data2[second][0];
        var y2 = data2[second][1];
        var yy = (y-x1)/(x2-x1)*(y2-y1)+y1;
        newData.push([x,yy]);
      });
      return newData;
    }
  }

  // Put the data in the lower table prettily.

  function fillData(data) {
    var dt = '';
    _.each(data,function(point) {
      dt += '(' + point[0] + ',' + point[1] + ')<br>';
    });
    $('#data').html(dt);
  }

  // If a dataset has repeated x-values, combine them by averaging the y-values.

  function cleanX(data) {
    var d1 = {};
    _.each(data,function(datum) {
      var x = datum[0];
      var y = datum[1];
      if (!(x in d1)) {d1[x] = [];}
      d1[x].push(y);
    });
    var d = [];
    _.each(d1,function(v,k) {
      var sum = 0;
      _.each(v,function(vv) {sum += vv;});
      d.push([Number(k),sum/v.length]);
    });
    d.sort(function(a,b) {
      return a[0] - b[0];
    });
    return d;
  }

  function purePlot(data,name,xLabel,yLabel) {
    $('#plot').highcharts({
      chart: {
        type: 'line'
      },
      title: {
        text: name
      },
      xAxis: {title: {text: xLabel}},
      yAxis: {title: {text: yLabel}},
      credits: {
        enabled: false
      },
      series: [
        {
          name: name,
          data: data
        }
      ]
    });
  }

  function dataGraph(myFiles) {

    var width = $('#dataGraph').width();
    var height =$('#dataGraph').height();

    // We build a node for each column.

    var cNames = {};
    var cPairs = [];
    _.each(myFiles,function(fileData,i) {
      cNames[fileData.columnNames[0]] = 1;
      cNames[fileData.columnNames[1]] = 1;
    });
    var nodes = [];
    var nodesHelper = {};
    var i = 0;
    _.each(cNames,function(value,key) {
      nodes.push({index:i,name:key});
      nodesHelper[key] = i;
      i++;
    });
    nodes.sort();

    // Next we assign links.

    links = [];
    _.each(myFiles,function(fileData,i) {
      links.push({source:nodesHelper[fileData.columnNames[0]],
                  target:nodesHelper[fileData.columnNames[1]],
                  index:i
                 });
    });

    var svg = d3.select('#dataGraph').append('svg')
          .attr('width', width)
          .attr('height', height);

    var force = d3.layout.force()
          .size([width, height])
          .gravity(0.05)
          .distance(100)
          .charge(-100)
          .nodes(nodes)
          .links(links);

    var link = svg.selectAll('.link')
          .data(links)
          .enter().append('line')
          .attr('class', 'linkgrey linkthin link')
          .attr('id',function(d) {return d.index;})
          .each(function() {
            var sel = d3.select(this);
            var state = false;
            sel.on('click', function() {

              // Basically we have to check whether this new click is
              // compatible with the array activeLinks and if so, we
              // add it and do the plot.
              // By "compatible" we mean that they form a chain.

              var s = links[this.id].source.name;
              var t = links[this.id].target.name;

              var used = _.union(_.flatten(currentChain));

              var done = false;
              var redraw = false;

              // If the chain is empty then we just put it in and we're done.

              if (currentChain.length === 0) {
                currentChain = [[s,t]];
                $(this).attr('class','linkred linkthick');
                done = true;
                redraw = true;
              }

              if (!done) {

                // Otherwise we have to think a bit.

                var chainHead = currentChain[0];
                var chainTail = currentChain[currentChain.length-1];

                // If it's either end then we delete it.

                if ((s === chainHead[0]) && (t === chainHead[1])) {
                  currentChain = _.rest(currentChain);
                  $(this).attr('class','linkgrey linkthin');
                  done = true;
                  redraw = true;
                } else if ((s === chainHead[1]) && (t === chainHead[0])) {
                  currentChain = _.rest(currentChain);
                  $(this).attr('class','linkgrey linkthin');
                  done = true;
                  redraw = true;
                } else if ((s === chainTail[0]) && (t === chainTail[1])) {
                  currentChain = _.initial(currentChain);
                  $(this).attr('class','linkgrey linkthin');
                  done = true;
                  redraw = true;
                } else if ((s === chainTail[1]) && (t === chainTail[0])) {
                  currentChain = _.initial(currentChain);
                  $(this).attr('class','linkgrey linkthin');
                  done = true;
                  redraw = true;
                }
              }

              // If not then if it matches either end but no other letter repeats
              // then we prepend or append it.

              if (!done) {
                if ((chainHead[0] === t) && (_.indexOf(used,s) === -1)) {
                  currentChain = _.union([[s,t]],currentChain);
                  $(this).attr('class','linkred linkthick');
                  done = true;
                  redraw = true;
                } else if ((chainHead[0] === s) && (_.indexOf(used,t) === -1)) {
                  currentChain = _.union([[t,s]],currentChain);
                  $(this).attr('class','linkred linkthick');
                  done = true;
                  redraw = true;
                } else if ((chainTail[1] === s) && (_.indexOf(used,t) === -1))  {
                  currentChain = _.union(currentChain,[[s,t]]);
                  $(this).attr('class','linkred linkthick');
                  done = true;
                  redraw = true;
                } else if ((chainTail[1] === t) && (_.indexOf(used,s) === -1)) {
                  currentChain = _.union(currentChain,[[t,s]]);
                  $(this).attr('class','linkred linkthick');
                  done = true;
                  redraw = true;
                }
              }

              // If either s or t appears in the current chain then we don't allow it
              // to be either added or subtracted.

              if (!done) {
                _.each(currentChain,function(v) {
                  if ((v[0] === s) || (v[1] === s) || (v[0] === t) || (v[0] === t)) {
                    done = true;
                  }
                });
              }

              // Are we good?

              if (redraw) {
                if (currentChain.length !== 0) {
                  var d = createDataFor(currentChain);
                  fillData(d);
                  var chainHead = currentChain[0];
                  var chainTail = currentChain[currentChain.length-1];
                  purePlot(d,chainTail[1] + ' as a function of ' + chainHead[0],chainHead[0],chainTail[1]);
                } else {
                  $('#plot').html('No Data');
                  $('#data').html('No Data');
                }
              }

            });
          });

    var node = svg.selectAll('.node')
          .data(nodes)
          .enter()
          .append('g');

    var circle = node
          .call(force.drag)
          .append('circle')
          .attr('class', 'node')
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
          .attr("r", function(d) { return 10;});

    var text = node
          .append("text")
          .attr("dx", function(d) {return d.textx;})
          .attr("dy", function(d) {return d.texty;})
          .attr("text-anchor", "middle")
          .attr("class","datatext")
          .text(function(d) { return d.name; });

    force.on('tick', function() {
      circle
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });
      text
        .attr("dx", function(d) { return d.x; })
        .attr("dy", function(d) { return d.y; });
      link
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

    });

    force.start();
  }

});
