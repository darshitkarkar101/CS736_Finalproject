

const sta_mainVis = document.getElementById('statistical-main-vis');
const radius_range = 1.8 * Math.PI;

var width;
var height;
var responsiveWidth;
var responsiveHeight;

var scaleup;
const thinknessTweak = 1.5;

var outerRadius_Country;
var innerRadius_Country;

var outerRadius_Purpose;
var innerRadius_Purpose;

var outerRadius_Period;
var innerRadius_Period;

var outerRadius_Mass;
var innerRadius_Mass;

var outerRadius_Dis;
var innerRadius_Dis;

var radius_central_circle;

var padAngle;

setDimensionVars();

var disBins;
var massBins;
var periodBins;


// Refine By dropdowns
sta_refineByCountry = document.querySelector('#sta_refineByCountry');
sta_refineByPurpose = document.querySelector('#sta_refineByPurpose');
sta_refineByOwner = document.querySelector('#sta_refineByOwner');
sta_refineByAttribute = document.querySelector('#sta_refineByAttribute');
sta_refineByYear = document.querySelector('#sta_refineByYear');

// field names
STA_FN_COUNTRY = 'new_country';
STA_FN_OWNER = 'Operator/Owner';
STA_FN_PURPOSE = 'new_purpose';
STA_FN_YEAR = 'new_year';
//const FN_ATTRIBUTE = 

var refineByParams = {};
var radioValue = 'Country';

// svg variables
var sta_satelliteData; // holds the satellite data
var earthCenter;
var scale;

const colorOfChart = {
    china: '#E12200',
    russia: '#9B56BB',
    UK: '#0079B8',
    USA: '#62A420',
    others: '#FAC400',
    civil: '#A92D38',
    commercial: '#FC4A34',
    government: '#CE5C30',
    military: '#D9883D',
    multi: '#FBD9B2',
    period: '#F46CA5',
    mass: '#B681CF',
    distance: '#6870C4',
    arcBackground: '#28333c',
    rightbar: '#49AFD9',
    hightlight: 'white'
}

const backgroundOpacity = 0.85;
const colorOpacity = 0.9;
const fadeOpacity = 0.3;

function setDimensionVars() {
    width = sta_mainVis.clientWidth;
    height = sta_mainVis.clientHeight;
    responsiveWidth = width / 1425;
    responsiveHeight = height / 750;

    scaleup = width / 800;

    outerRadius_Country = 170 * scaleup;
    innerRadius_Country = (155 - thinknessTweak) * scaleup;

    outerRadius_Purpose = 150 * scaleup;
    innerRadius_Purpose = (135 - thinknessTweak) * scaleup;

    outerRadius_Period = 130 * scaleup;
    innerRadius_Period = (100 - thinknessTweak) * scaleup;

    outerRadius_Mass = 95 * scaleup;
    innerRadius_Mass = (65 - thinknessTweak) * scaleup;

    outerRadius_Dis = 60 * scaleup;
    innerRadius_Dis = (30 - thinknessTweak) * scaleup;

    radius_central_circle = 25 * scaleup;

    padAngle = 0.003;
}

function colorOfCountryStyle (d, name) {
    if (d[name] == 'USA'){
        return colorOfChart.USA;
    }
    else if (d[name] == 'Russia'){
        return colorOfChart.russia;
    }
    else if(d[name] =='China'){
        return colorOfChart.china;
    }
    else if(d[name] == 'Others'){
        return colorOfChart.others;
    }
    else if(d[name] == 'UK'){
        return colorOfChart.UK;
    }
}

function colorOfPurposeStyle (d, name) {
    if (d[name] == 'Civil'){
        return colorOfChart.civil;
    }
    else if (d[name] == 'Military'){
        return colorOfChart.military;
    }
    else if(d[name] =='Government'){
        return colorOfChart.government;
    }
    else if(d[name] == 'Multi-purpose'){
        return colorOfChart.multi;
    }
    else if(d[name] == 'Commercial'){
        return colorOfChart.commercial;
    }
    else {
        return colorOfChart.multi;
    }
}

// Tooltip variables
const tooltipXOffset = 5;
const tooltipYOffset = 20;

Math.degrees = function(radians) {
	return radians * 180 / Math.PI;
}


function sta_updateChart(refineParam,radioValue) {
    updateChartArgs = arguments;
    var sta_filteredSatellites = sta_satelliteData.filter(function(d){
        let match = true;
        for (let key in refineParam) {
            if (refineParam[key] == 'All (5)'){

                continue;
            }
            else if (d[key] !== refineParam[key]) {
                match = false;
                break;
            }
        }
        return match;
    });
    //console.log(radioValue);
    sta_dataset = sta_filteredSatellites;
    d3.select('#statistical-main-vis').selectAll('g').remove();

    // Sort all bar charts in the main vis
    if (radioValue =='Country'){
        sta_dataset = sta_dataset.sort((a,b)=>d3.ascending(a['new_country'],b['new_country']));
    }
    else if(radioValue =='Purpose'){
        sta_dataset = sta_dataset.sort((a,b)=>d3.ascending(a['new_purpose'],b['new_purpose']));
    }
    else if(radioValue =='Period'){
        sta_dataset = sta_dataset.sort((a,b)=>d3.ascending(parseFloat(a['Period (minutes)']),parseFloat(b['Period (minutes)'])));
    }
    else if(radioValue == 'Mass'){
        sta_dataset = sta_dataset.sort((a,b)=>d3.ascending(parseFloat(a['Launch Mass (kg.)']),parseFloat(b['Launch Mass (kg.)'])));
    }
    else if(radioValue == 'Dis'){
        sta_dataset = sta_dataset.sort((a,b)=>d3.ascending(parseFloat(a['avgDis']),parseFloat(b['avgDis'])));
    }
    else{
        
    }

    var maxPeriod = d3.max(sta_dataset, function(d){
        return +d['log_period'];
    });

    var maxMass = d3.max(sta_dataset,function(d){
        return +d['log_mass'];
    });

    var maxDis = d3.max(sta_dataset,function(d){
        return +d['log_dis'];
    }); 
    
    var x = d3.scaleBand()
        .range([0, radius_range])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing ?
        .domain( sta_dataset.map(function(d) { return d['Name of Satellite  Alternate Names']; }) ); // The domain of the X axis is the list of states.

    var y_period = d3.scaleRadial()
    .range([outerRadius_Period,innerRadius_Period])
    .domain([0,maxPeriod]);

    var y_dis = d3.scaleRadial()
    .range([outerRadius_Dis,innerRadius_Dis])
    .domain([0,maxDis]);

    var y_mass = d3.scaleRadial()
    .range([outerRadius_Mass,innerRadius_Mass])
    .domain([0,maxMass]);

    var y_purpose = d3.scaleRadial()
    .range([outerRadius_Purpose,innerRadius_Purpose])
    .domain([0,1]);

    var y_country = d3.scaleRadial()
    .range([outerRadius_Country,innerRadius_Country])
    .domain([0,1]);

    var svg = d3.select('#statistical-main-vis')
    .append("g")
    .attr("class", "g_main")
    .attr("transform", "translate(" + (width/2 - 20) + "," + ( height/2 + 30)+ ")"); // Add 100 on Y translation, cause upper bars are longer;


    // *** Create labels for rings ***
    var Country_label = svg.append('text')
    .style("text-anchor", "end")
    .attr('x', -5)
    .attr('y', (-((outerRadius_Country-innerRadius_Country)/2 + innerRadius_Country)))
    .text('Country');

    var Purpose_label = svg.append('text')
    .style("text-anchor", "end")
    .attr('x', -5)
    .attr('y', (-((outerRadius_Purpose-innerRadius_Purpose)/2 + innerRadius_Purpose)))
    .text('Purpose');

    var period_label = svg.append('text')
    .style("text-anchor", "end")
    .attr('x', -5)
    .attr('y', (-((outerRadius_Period-innerRadius_Period)/2 + innerRadius_Period)))
    .text('Period (min)');

    var mass_label = svg.append('text')
    .style("text-anchor", "end")
    .attr('x', -5)
    .attr('y', (-((outerRadius_Mass-innerRadius_Mass)/2 + innerRadius_Mass)))
    .text('Mass (kg)');

    var dis_label = svg.append('text')
    .style("text-anchor", "end")
    .attr('x', -5)
    .attr('y', (-((outerRadius_Dis-innerRadius_Dis)/2 + innerRadius_Dis)))
    .text('Dis (km)');


    // Count the number for each purpose
    var Civil = 0;
    var Commercial = 0;
    var Military = 0;
    var Government = 0;
    var Multi_purpose = 0;

    for (var i = 0; i < sta_dataset.length; i++) {
        if (sta_dataset[i]['new_purpose'] == 'Civil'){
            Civil++;
        }
        else if (sta_dataset[i]['new_purpose'] == 'Commercial'){
            Commercial++;
        }
        else if (sta_dataset[i]['new_purpose'] == 'Military'){
            Military++;
        }
        else if (sta_dataset[i]['new_purpose'] == 'Government'){
            Government++;
        }
        else if (sta_dataset[i]['new_purpose'] == 'Multi-purpose'){
            Multi_purpose++;
        }
    }

    // Set angles for each part in the ring of Purpose
    var all = Civil + Commercial + Military + Government + Multi_purpose;
    var Civil_p = Civil / all * radius_range;
    var Commercial_p = Commercial / all * radius_range;
    var Military_p = Military / all * radius_range;
    var Government_p = Government / all * radius_range;
    var Multi_purpose_p = Multi_purpose / all * radius_range;
    
    var purpose = [  //Set the sequence for the ring of Purpose
        { purpose: 'Civil', start_angle : 0, angle : Civil_p },
        { purpose: 'Commercial', start_angle : Civil_p, angle : Commercial_p },
        { purpose: 'Government', start_angle : Commercial_p + Civil_p, angle : Government_p },
        { purpose: 'Military', start_angle : Commercial_p + Civil_p + Government_p, angle : Military_p },
        { purpose: 'Multi_purpose', start_angle : Commercial_p + Civil_p + Military_p + Government_p, angle : Multi_purpose_p }
    ]

    var purpose_statistical = [
        { purpose: 'Civil', count : Civil},
        { purpose: 'Commercial', count : Commercial},
        { purpose: 'Government', count : Government},
        { purpose: 'Military', count : Military },
        { purpose: 'Multi_purpose', count : Multi_purpose }
    ]

    var purpose_tooltip = { //Count only for tooltip
        'Civil': Civil,
        'Commercial': Commercial,
        'Government': Government,
        'Military': Military,
        'Multi_purpose': Multi_purpose
    }

    // Count the number for each country
    var USA = 0;
    var China = 0;
    var UK = 0;
    var Russia = 0;
    var Others = 0;
    
    for (var i = 0; i < sta_dataset.length; i++) {
        if (sta_dataset[i]['new_country'] == 'USA'){
            USA++;
        }
        else if (sta_dataset[i]['new_country'] == 'UK'){
            UK++;
        }
        else if (sta_dataset[i]['new_country'] == 'China'){
            China++;
        }
        else if (sta_dataset[i]['new_country'] == 'Russia'){
            Russia++;
        }
        else if (sta_dataset[i]['new_country'] == 'Others'){
            Others++;
        }
    }

    // Set angles for each part in the ring of Country
    var all = USA + UK + China + Russia + Others;
    var USA_p = USA / all * radius_range;
    var China_p = China / all * radius_range;
    var Russia_p = Russia / all * radius_range;
    var UK_p = UK / all * radius_range;
    var Others_p = Others / all * radius_range;

    var country = [  //Set the sequence for the ring of Country
        { country: 'China', start_angle: 0, angle : China_p },
        { country: 'Others', start_angle: China_p, angle : Others_p },
        { country: 'Russia', start_angle: China_p + Others_p, angle : Russia_p },
        { country: 'UK', start_angle: China_p + Others_p + Russia_p, angle : UK_p },
        { country: 'USA', start_angle: China_p + Others_p + Russia_p + UK_p, angle : USA_p },
    ]

    var country_statistical = [
        { country: 'China', count : China},
        { country: 'Russia', count : Russia},
        { country: 'USA', count : USA},
        { country: 'UK', count : UK },
        { country: 'Others', count : Others },
    ]

    var country_tooltip = { //Count only for tooltip
        'China': China,
        'Others': Others,
        'Russia': Russia,
        'UK': UK,
        'USA': USA
    }
    

    // *** Create a tooltip when hovering over the chart ***
    var Tooltip = d3.select("#div_template")
    .append("div")
    .attr("class", "tooltip")
    .style("pointer-events", 'none')
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("color","black")
    .style("border-radius", "5px")
    .style("padding", "12px")

    var mouseover = function(d) {
        // console.log("Into mouseover");
        Tooltip
          .style("opacity", 1)

        d3.select(this)
          .style("stroke", "white")
          .style("stroke-width", '1px')
          .style("opacity", 1)
      }

    var mousemove = function(d) { // Create tooltips and highlighting effect when hovering over bars

        Tooltip // Add tooltip to bars when hovered
          .html("Satellite Name: " + d['Name of Satellite  Alternate Names']  + "<br>"
          + "Country: " + d['new_country']  + "<br>" 
          + "Purpose: " + d['new_purpose']  + "<br>"
          + "Orbit Peroid: " + d['Period (minutes)']  + "min"+ "<br>"
          + "Mass: " + d['Launch Mass (kg.)']  + "kg"+ "<br>"
          + "Distance to Earth: " + d['avgDis']  + "km"+ "<br>")
          .attr('class', 'tooltip')
          .style("left", (d3.mouse(svg.node())[0]+ tooltipXOffset + width/2) + "px")
          .style("top", (d3.mouse(svg.node())[1]+ tooltipYOffset + height/2) + "px");

          d3.selectAll("rect")
          .style("opacity", fadeOpacity);
        
          d3.selectAll("rect." + d['new_country'])
          .style("opacity", colorOpacity);

          d3.selectAll("rect." + d['new_purpose'])
          .style("opacity", colorOpacity);

          disBins.forEach(function (bin){
              var x0 = bin.x0;
              var x1 = bin.x1;
              if(d['avgDis']>=x0 && d['avgDis']<=x1){
                //   console.log(x0);
                //   console.log(d['avgDis']);
                d3.selectAll("rect.dis" + Math.round(x0))
                .style("opacity", colorOpacity);
              }
          });

          massBins.forEach(function (bin){
            var x0 = bin.x0;
            var x1 = bin.x1;
            if(d['Launch Mass (kg.)']>=x0 && d['Launch Mass (kg.)']<=x1){
              d3.selectAll("rect.mass" + Math.round(x0))
              .style("opacity", colorOpacity);
            }
        });

        periodBins.forEach(function (bin){
            var x0 = bin.x0;
            var x1 = bin.x1;
            if(d['Period (minutes)']>=x0 && d['Period (minutes)']<=x1){
              d3.selectAll("rect.period" + Math.round(x0))
              .style("opacity", colorOpacity);
            }
        });
    }

    var country_mousemove = function(d){
        Tooltip
        .html("Country: " + d['country'] + "<br>"
        + "Number of satellites: " + country_tooltip[d['country']])
        .style("left", (d3.mouse(this)[0]+ tooltipXOffset + width/2) + "px")
        .style("top", (d3.mouse(this)[1]+ tooltipYOffset + height/2) + "px")
    }

    var purpose_mousemove = function(d){
        Tooltip
        .html("Purpose: " + d['purpose'] + "<br>"
        + "Number of satellites: " + purpose_tooltip[d['purpose']])
        .style("left", (d3.mouse(this)[0]+ tooltipXOffset + width/2) + "px")
        .style("top", (d3.mouse(this)[1]+ tooltipYOffset + height/2) + "px")
    }

    var mouseleave = function(d) {
        Tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", "none")
          .style("opacity", colorOpacity)

          d3.selectAll("rect")
          .style("opacity",1);

    //     d3.selectAll("rect." + d['new_country'])
    //       .style("fill", colorOfChart.rightbar);

    //     d3.selectAll("rect." + d['new_purpose'])
    //       .style("fill", colorOfChart.rightbar);

    //       disBins.forEach(function (bin){
    //         var x0 = bin.x0;
    //         var x1 = bin.x1;
    //         if(d['avgDis']>=x0 && d['avgDis']<=x1){
    //           d3.selectAll("rect.dis" + Math.round(x0))
    //           .style("fill", colorOfChart.rightbar);
    //         }
    //     });

    //     massBins.forEach(function (bin){
    //       var x0 = bin.x0;
    //       var x1 = bin.x1;
    //       if(d['Launch Mass (kg.)']>=x0 && d['Launch Mass (kg.)']<=x1){
    //         d3.selectAll("rect.mass" + Math.round(x0))
    //         .style("fill", colorOfChart.rightbar);
    //       }
    //   });

    //   periodBins.forEach(function (bin){
    //       var x0 = bin.x0;
    //       var x1 = bin.x1;
    //       if(d['Period (minutes)']>=x0 && d['Period (minutes)']<=x1){
    //         d3.selectAll("rect.period" + Math.round(x0))
    //         .style("fill", colorOfChart.rightbar);
    //       }
    //   });
    }

    
    // *** If 'Purpose' is selected in Sort By ***
    if (radioValue == 'Purpose'){
        document.getElementById("country_legend").classList.remove('no-display');
        document.getElementById("purpose_legend").classList.add('no-display');

        var purposeBar = svg.append('g')
        .attr("class", "g_main")
        .selectAll('path')
        .data(purpose)
        .enter()
        .append('path')
        .attr('fill', function(d){
            return colorOfPurposeStyle(d, 'purpose');
        })
        .attr("opacity", colorOpacity)
        .attr('d',d3.arc()
        .innerRadius( function(d) { return y_purpose(0) })
        .outerRadius(function(d){return y_purpose(1);})
        .startAngle(function(d){return d['start_angle'];})
        .endAngle(function(d){return d['start_angle'] + d['angle'];})
        .padAngle(0)
        .padRadius(outerRadius_Purpose)
        )
        .on('mouseover', mouseover)
        .on('mousemove', purpose_mousemove)
        .on('mouseout', mouseleave);

    var purpose_caption_radius = innerRadius_Purpose + (outerRadius_Purpose - innerRadius_Purpose)/2 - 5;

    var purpose_caption = svg.append('g')
    .attr("class", "g_caption")
    .selectAll('text')
    .data(purpose)
    .enter()
    .append('text')
    .style("text-anchor", "middle")
    .attr('x', 0)
    .attr('y', 0)
    .attr("transform", function(d) {
        var degree = Math.degrees( d['start_angle'] + d['angle']/2);
        var radians = d['start_angle'] + d['angle']/2;
         return ("translate(" +(purpose_caption_radius * Math.sin(radians)) + "," + (-purpose_caption_radius * Math.cos(radians)) +") rotate(" + (degree)  +")")

     })
    .text(function(d){
        if (d['angle'] > 0.05 && d['purpose'] != 'Multi_purpose' && d['purpose'] != 'Government'){ // Set the minimum angle to display government and multipurpose
            return d['purpose'];
        }
        else if((d['angle'] > 0.15 && d['purpose'] == 'Multi_purpose')){
            //console.log(d['purpose']);
            return "Multi-Purpose";
        }
        else if((d['angle'] > 0.15 && d['purpose'] == 'Government')){
            //console.log(d['purpose']);
            return "Government";
        }
        else{
            //console.log(d['purpose']);
            return '';
        }
    });
} else {
    var purposeBar = svg.append('g')
    .attr("class", "g_main")
    .selectAll('path')
    .data(sta_dataset)
    .enter()
    .append('path')
    .attr('fill',function(d){
        return colorOfPurposeStyle(d, 'new_purpose');
    })
    .attr("opacity", colorOpacity)
    .attr('d',d3.arc()
    .innerRadius( function(d) { return y_purpose(0) })
    .outerRadius(function(d){return y_purpose(1);})
    .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
    .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
    .padAngle(padAngle)
    .padRadius(outerRadius_Purpose)
    )
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseleave);
}

// If 'Country' is selected in Sort By
if (radioValue == 'Country'){
    document.getElementById("country_legend").classList.add('no-display');
    document.getElementById("purpose_legend").classList.remove('no-display');
    var CountryBar = svg
    .append('g')
    .attr("class", "g_main")
    .selectAll('path')
    .data(country)
    .enter()
    .append('path')
    .attr('fill', function(d){
        return colorOfCountryStyle (d, 'country')
    })
    .attr("opacity", colorOpacity)
    .attr('d',d3.arc()
    .innerRadius( function(d) { return y_country(0) })
    .outerRadius(function(d){return y_country(1);})
    // .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
    // .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth()+0.005;})
    .startAngle(function(d){return d['start_angle'];})
    .endAngle(function(d){return d['start_angle'] + d['angle'];})
    .padAngle(0)
    .padRadius(outerRadius_Country)
    )
    .on('mouseover', mouseover)
    .on('mousemove', country_mousemove)
    .on('mouseout', mouseleave);


    var country_caption_radius = innerRadius_Country + (outerRadius_Country - innerRadius_Country)/2 - 5;

    var country_caption = svg.append('g')
    .attr("class", "g_caption")
    .selectAll('text')
    .data(country)
    .enter()
    .append('text')
    .style("text-anchor", "middle")
    .attr('x', 0)
    //.attr('y', -purpose_caption_radius)
    .attr('y', 0)
    .attr("transform", function(d) {
        var degree = Math.degrees( d['start_angle'] + d['angle']/2);
        var radians = d['start_angle'] + d['angle']/2;
        //console.log(degree);
        //console.log(country_caption_radius * Math.sin(degree));
        //console.log(country_caption_radius * Math.cos(degree));
         return ("translate(" +(country_caption_radius * Math.sin(radians)) + "," + (-country_caption_radius * Math.cos(radians)) +") rotate(" + (degree)  +")")
     })
    .text(function(d){
        if (d['angle'] > 0.05){
            return d['country'];
        }
        else{
            return '';
        }
    });
} else {
    // 1. Plot the ring of Country when Purpose is selected in Sort By
    var CountryBar = svg.append('g')  
    .attr("class", "g_main")
    .selectAll('path')
    .data(sta_dataset)
    .enter()
    .append('path')
    .attr('fill',function(d){
        return colorOfCountryStyle (d, 'new_country')
    })
    .attr("opacity", colorOpacity)
    .attr('d',d3.arc()
    .innerRadius( function(d) { return y_country(0) })
    .outerRadius(function(d){return y_country(1);})
    .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
    .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
    .padAngle(padAngle)
    .padRadius(outerRadius_Country)
    )
    .on('mouseover', mouseover)
    .on('mousemove', mousemove)
    .on('mouseout', mouseleave);
    }

    // 2. Plot the ring of Period when Purpose is selected in Sort By
    var periodBar_background = svg.append('g') 
    .attr("class", "g_main")
    .selectAll('path')
    .data(sta_dataset)
    .enter()
    .append('path')
    .attr("fill-opacity", backgroundOpacity)
    .attr('fill', colorOfChart.arcBackground)
    .attr('d',d3.arc()
        .innerRadius( function(d) { return y_period(0) })
        .outerRadius(function(d){return y_period(maxPeriod);})
        .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
        .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
        .padAngle(padAngle)
        .padRadius(outerRadius_Period)
    );

    var periodBar = svg
        .append('g')
        .attr("class", "g_main")
        .selectAll('path')
        .data(sta_dataset)
        .enter()
        .append('path')
        .attr('fill', colorOfChart.period)
        .attr("opacity", colorOpacity)
        .attr('class','arc')
        .attr('d',d3.arc()
            .innerRadius( function(d) { return y_period(0); })
            .outerRadius(function(d){return y_period(d['log_period']);})
            .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
            .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
            .padAngle(padAngle)
            .padRadius(outerRadius_Period)
        )
        // .on('mouseover', function(d){console.log(d['new_country']);})
        // .on('mousemove', function(d){console.log(d['new_country']);})
        // .on('mouseout', function(d){console.log(d['new_country']);});
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseleave);

    // 3. Plot the ring of Mass when Purpose is selected in Sort By
    var massBar_background = svg.append('g')
    .attr("class", "g_main")
        .selectAll('path')
        .data(sta_dataset)
        .enter()
        .append('path')
        .attr("fill-opacity", backgroundOpacity)
        .attr('fill', colorOfChart.arcBackground)
        .attr('d',d3.arc()
            .innerRadius( function(d) { return y_mass(0) })
            .outerRadius(function(d){return y_mass(maxMass);})
            .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
            .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
            .padAngle(padAngle)
            .padRadius(outerRadius_Mass)
        );

    var massBar = svg.append('g')
        .selectAll('path')
        .data(sta_dataset)
        .enter()
        .append('path')
        .attr('fill', colorOfChart.mass)
        .attr("opacity", colorOpacity)
        .attr('d',d3.arc()
            .innerRadius( function(d) { return y_mass(0) })
            .outerRadius(function(d){return y_mass(d['log_mass']);})
            .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
            .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
            .padAngle(padAngle)
            .padRadius(outerRadius_Mass)
        )
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseleave);

    // 4. Plot the ring of Distance when Purpose is selected in Sort By
    var disBar_background = svg.append('g')
        .selectAll('path')
        .data(sta_dataset)
        .enter()
        .append('path')
        .attr("fill-opacity", backgroundOpacity)
        .attr('fill', colorOfChart.arcBackground)
        .attr('d',d3.arc()
            .innerRadius( function(d) { return y_dis(0) })
            .outerRadius(function(d){return y_dis(maxDis);})
            .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
            .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
            .padAngle(padAngle)
            .padRadius(outerRadius_Dis)
        );

    var disBar = svg.append('g')
        .selectAll('path')
        .data(sta_dataset)
        .enter()
        .append('path')
        .attr('fill', colorOfChart.distance)
        .attr("opacity", colorOpacity)
        .attr('d',d3.arc()
            .innerRadius( function(d) { return y_dis(0) })
            .outerRadius(function(d){return y_dis(d['log_dis']);})
            .startAngle(function(d){return x(d['Name of Satellite  Alternate Names']);})
            .endAngle(function(d){return x(d['Name of Satellite  Alternate Names']) + x.bandwidth();})
            .padAngle(padAngle)
            .padRadius(outerRadius_Dis)
        )
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseleave);

    // Plot the central circle when Purpose is selected in Sort By
    var central_circle = svg.append('g')
        .append('circle')
        .attr('r', radius_central_circle )
        .attr("fill-opacity", backgroundOpacity)
        .attr('fill', colorOfChart.arcBackground);


    // *** Create bar charts on the right ***
    var main_svg = d3.select('#statistical-main-vis');
    let barchart_width = 240 * responsiveWidth;
    let barchart_height = 65 * responsiveHeight;
    let disArray = sta_dataset.map(d => parseFloat(d['avgDis']));
    let periodArray = sta_dataset.map(d => parseFloat(d['Period (minutes)']));
    let massArray = sta_dataset.map(d => parseFloat(d['Launch Mass (kg.)']));
    let bin_dis = 5;
    let bin_period = 5;
    let bin_mass = 5;
    let y_tick = 4;

    var svgWidth = mainVis.clientWidth;
    var pad = {t: 115, r: 300 * responsiveWidth, b: 40, l: 40};
    var bar_gap = 55;


    // *** Barchart of Country ***
    var country_barchart = main_svg.append('g')
    .attr('transform', 'translate('+ [svgWidth - pad.r, pad.t]  + ')');

    country_barchart.append('text')
    .attr('class', 'bar_label')
    .attr('transform', 'translate('+ [barchart_width/2-12, barchart_height+30]  + ')')
    .text('Country');
    
    var x_country = d3.scaleBand()
                    .range([0, barchart_width])
                    .padding(0.1);
                    
    var y_country = d3.scaleLinear().range([barchart_height, 0]);

    x_country.domain(country_statistical.map(function(d) { return d['country']; }));
    y_country.domain([0, d3.max(country_statistical, function(d) { return d['count']; })]);

    country_barchart.selectAll("rect")
    .data(country_statistical)
    .enter().append("rect")
    .attr("class", function(d){ return d['country']; })
    .attr("x", function(d) { return x_country(d['country']); })
    .attr("width", x_country.bandwidth())
    .attr("y", function(d) { return y_country(d['count']); })
    .attr("height", function(d) { return barchart_height - y_country(d['count']); })
    .style("fill", colorOfChart.rightbar)
    .style('opacity', colorOpacity);

    country_barchart.append("g")
    .attr("transform", "translate(0," + barchart_height + ")")
    .attr('class','axis')
    .call(d3.axisBottom(x_country));

    country_barchart.append("g")
    .attr('class','axis')
    .call(d3.axisLeft(y_country).ticks(y_tick));


    // *** Barchart of Purpose ***
    var purpose_barchart = main_svg.append('g')
    .attr('transform', 'translate('+ [svgWidth - pad.r, pad.t + barchart_height + bar_gap]  + ')');

    purpose_barchart.append('text')
    .attr('class', 'bar_label')
    .attr('transform', 'translate('+ [barchart_width/2-15, barchart_height+30]  + ')')
    .text('Purpose');
    
    var x_purpose = d3.scaleBand()
                    .range([0, barchart_width])
                    .padding(0.1);

    var y_purpose = d3.scaleLinear().range([barchart_height, 0]);

    x_purpose.domain(purpose_statistical.map(function(d) { return d['purpose']; }));
    y_purpose.domain([0, d3.max(purpose_statistical, function(d) { return d['count']; })]);

    purpose_barchart.selectAll("rect")
    .data(purpose_statistical)
    .enter().append("rect")
    .attr("class", function(d){ return d['purpose']; })
    .attr("x", function(d) { return x_purpose(d['purpose']); })
    .attr("width", x_purpose.bandwidth())
    .attr("y", function(d) { return y_purpose(d['count']); })
    .attr("height", function(d) { return barchart_height - y_purpose(d['count']); })
    .style("fill", colorOfChart.rightbar)
    .style('opacity', colorOpacity);

    purpose_barchart.append("g")
    .attr("transform", "translate(0," + barchart_height + ")")
    .attr('class','axis')
    .call(d3.axisBottom(x_purpose));

    purpose_barchart.append("g")
    .attr('class','axis')
    .call(d3.axisLeft(y_purpose).ticks(y_tick));

    // *** Barchart of Period ***
    var period_barchart = main_svg.append('g')
    .attr('transform', 'translate('+ [svgWidth - pad.r, pad.t + barchart_height * 2 + bar_gap * 2]  + ')');

    period_barchart.append('text')
    .attr('class', 'bar_label')
    .attr('transform', 'translate('+ [barchart_width/2-40, barchart_height+30]  + ')')
    .text('Orbit Period (min)');

    min_period = d3.min(periodArray);
    max_period = d3.max(periodArray);
    var x_period = d3.scaleLinear()
    .domain([min_period,max_period])
    .range([0,barchart_width]);

    period_barchart.append('g')
    .attr('class','axis')
    .attr('transform', 'translate(0,' +barchart_height + ')')
    .call(d3.axisBottom(x_period).ticks(bin_period));

    var period_histogram = d3.histogram()
    .domain(x_period.domain())
    .thresholds(x_period.ticks(bin_period));
    
    var period_bins = period_histogram(periodArray);
    periodBins = period_bins;

    var y_period = d3.scaleLinear()
    .range([barchart_height, 0]);

    y_period.domain([0, d3.max(period_bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    
    period_barchart.append("g")
    .attr('class','axis')
    .call(d3.axisLeft(y_period).ticks(y_tick));

    period_barchart.selectAll("rect")
    .data(period_bins)
    .enter()
    .append("rect")
    .attr("class", function(d){ return 'period' + Math.round(d.x0); })
    .attr("x", 1)
    .attr("transform", function(d) { return "translate("  + x_period(d.x0) + ","  + y_period(d.length) + ")"; })
    .attr("width", function(d) { return x_period(d.x1) - x_period(d.x0) -1 ; })
    .attr("height", function(d) { return barchart_height - y_period(d.length); })
    .style("fill", colorOfChart.rightbar)
    .style('opacity', colorOpacity);


    // *** Barchart of Mass ***
    var mass_barchart = main_svg.append('g')
    .attr('transform', 'translate('+ [svgWidth - pad.r, pad.t + barchart_height * 3  + bar_gap * 3]  + ')');

    mass_barchart.append('text')
    .attr('class', 'bar_label')
    .attr('transform', 'translate('+ [barchart_width/2-15, barchart_height+30]  + ')')
    .text('Mass (kg)');

    min_mass = d3.min(massArray);
    max_mass = d3.max(massArray);

    var x_mass = d3.scaleLinear()
    .domain([min_mass,max_mass])
    .range([0,barchart_width]);

    mass_barchart.append('g')
    .attr('class','axis')
    .attr('transform', 'translate(0,' +barchart_height + ')')
    .call(d3.axisBottom(x_mass).ticks(bin_mass));

    var mass_histogram = d3.histogram()
    .domain(x_mass.domain())
    .thresholds(x_mass.ticks(bin_mass));
    
    var mass_bins = mass_histogram(massArray);
    massBins = mass_bins;

    var y_mass = d3.scaleLinear()
    .range([barchart_height, 0]);

    y_mass.domain([0, d3.max(mass_bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    
    mass_barchart.append("g")
    .attr('class','axis')
    .call(d3.axisLeft(y_mass).ticks(y_tick));

    mass_barchart.selectAll("rect")
    .data(mass_bins)
    .enter()
    .append("rect")
    .attr("class", function(d){ return 'mass' + Math.round(d.x0); })
    .attr("x", 1)
    .attr("transform", function(d) { return "translate("  + x_mass(d.x0) + ","  + y_mass(d.length) + ")"; })
    .attr("width", function(d) { return x_mass(d.x1) - x_mass(d.x0) -1 ; })
    .attr("height", function(d) { return barchart_height - y_mass(d.length); })
    .style("fill", colorOfChart.rightbar)
    .style('opacity', colorOpacity);


    // *** Barchart of Distance to Earth ***
    var dis_barchart = main_svg.append('g')
    .attr('transform', 'translate('+ [svgWidth - pad.r, pad.t + barchart_height * 4 + bar_gap * 4]  + ')');

    dis_barchart.append('text')
    .attr('class', 'bar_label')
    .attr('transform', 'translate('+ [barchart_width/2-55, barchart_height+30]  + ')')
    .text('Distance to Earth (km)');

    min_avgDis = d3.min(disArray);
    max_avgDis = d3.max(disArray);

    var x_dis = d3.scaleLinear()
    .domain([min_avgDis,max_avgDis])
    .range([0,barchart_width]);

    dis_barchart.append('g')
    .attr('class','axis')
    .attr('transform', 'translate(0,' +barchart_height + ')')
    .call(d3.axisBottom(x_dis).ticks(bin_dis));

    var dis_histogram = d3.histogram() 
    .domain(x_dis.domain())
    .thresholds(x_dis.ticks(bin_dis));
    
    var bins = dis_histogram(disArray) ;
    disBins = bins;

    var y_dis = d3.scaleLog()
    .range([0, barchart_height]);

    //console.log(bins[0].x0);

    //y_dis.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    y_dis.domain([1000, 1]);

    dis_barchart.append("g")
    .attr('class','axis')
    .call(d3.axisLeft(y_dis).ticks(y_tick));

    dis_barchart.selectAll("rect") 
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", function(d){ return 'dis' + Math.round(d.x0); })
    .attr("x", 1)
    .attr("transform", function(d) { 
        if (d.length == 0){
            return "translate("  + x_dis(d.x0) + ","  + 0 + ")";
        }
        else{
            return "translate("  + x_dis(d.x0) + ","  + (y_dis(d.length)) + ")"; 
        }
    })
    .attr("width", function(d) { return x_dis(d.x1) - x_dis(d.x0) -1 ; })
    .attr("height", function(d) { 
        if(d.length ==0){
            return 0;
        }
        else{
            return  barchart_height - y_dis(d.length);
        }
        })
    .style("fill", colorOfChart.rightbar)
    .style('opacity', colorOpacity);
}

// *** load CSV ***
d3.csv('../cleanData.csv').then(function(sta_dataset) {
sta_satelliteData = sta_dataset;

// Acquire and sort options for Refine By dropdowns
let countries = Object.keys(sta_dataset.reduce((options, d) => {
    const fieldName = STA_FN_COUNTRY;
    if (!options[d[fieldName]]) {
        options[d[fieldName]] = d[fieldName]; // can later make key, value pair different to display different things in dropdown options
    }
    return options;
}, {})).sort();

countries.sort(
    function (a,b){
        if (a =='Others'){
            return 1;
        }
        else if (b == 'Others'){
            return -1
        }
        else{
            return b-a;
        }
    }
);
countries.unshift('All (5)');

let purposes = Object.keys(sta_dataset.reduce((options, d) => {
    const fieldName = STA_FN_PURPOSE;
    if (!options[d[fieldName]]) {
        options[d[fieldName]] = d[fieldName]; // can later make key, value pair different to display different things in dropdown options
    }
    return options;
}, {})).sort();
purposes.push('All (5)');
purposes.sort();

let years = Object.keys(sta_dataset.reduce((options, d) => {
    const fieldName = STA_FN_YEAR;
    if (!options[d[fieldName]]) {
        options[d[fieldName]] = d[fieldName]; // can later make key, value pair different to display different things in dropdown options
    }
    return options;
}, {})).sort((a, b) => b - a);

const sta_populateRefineBy = (selectEle, options) => {
    for (const option of options) {
        selectEle.innerHTML+= `<option value="${option}">${option}</option>`;
    }
}
sta_populateRefineBy(sta_refineByCountry, countries);
sta_populateRefineBy(sta_refineByPurpose, purposes);
sta_populateRefineBy(sta_refineByYear, years);
refineByParams[STA_FN_COUNTRY] = 'All (5)';
refineByParams[STA_FN_YEAR] = '2020';
refineByParams[STA_FN_PURPOSE] = 'All (5)';
sta_updateChart(refineByParams,radioValue);
});


// Filter By Listeners
document.querySelector('#sta_refineByCountry').addEventListener('change', (event) => {
    refineByParams[STA_FN_COUNTRY] = event.target.value;
    sta_updateChart(refineByParams,radioValue);
});

document.querySelector('#sta_refineByPurpose').addEventListener('change', (event) => {
    refineByParams[STA_FN_PURPOSE] = event.target.value;
    sta_updateChart(refineByParams,radioValue);
});

document.querySelector('#sta_refineByYear').addEventListener('change', (event) => {
    refineByParams[STA_FN_YEAR] = event.target.value;
    sta_updateChart(refineByParams,radioValue);
});

document.querySelector('#radioCountry').addEventListener('change', (event) => {
    radioValue = 'Country';
    sta_updateChart(refineByParams,radioValue)
});
document.querySelector('#radioPurpose').addEventListener('change', (event) => {
    radioValue = 'Purpose';
    sta_updateChart(refineByParams,radioValue)
});
document.querySelector('#radioPeriod').addEventListener('change', (event) => {
    radioValue = 'Period';
    sta_updateChart(refineByParams,radioValue)
});
document.querySelector('#radioMass').addEventListener('change', (event) => {
    radioValue = 'Mass';
    sta_updateChart(refineByParams,radioValue)
});
document.querySelector('#radioDis').addEventListener('change', (event) => {
    radioValue = 'Dis';
    sta_updateChart(refineByParams,radioValue)
});

var updateChartArgs;
window.addEventListener("resize", () => {
    setDimensionVars();
    sta_updateChart(...updateChartArgs);
});