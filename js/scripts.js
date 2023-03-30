$(function () {
	// *** APIs ***
	//* clima, previsão 12 horas e previsão 5 dias: https://developer.accuweather.com/apis
	//* pegar coordenadas geográficas pelo nome da cidade: https://docs.mapbox.com/api/
	//* pegar coordenadas do IP: http://www.geoplugin.net
	//* gerar gráficos em JS: https://www.highcharts.com/demo

	const accuweatherAPIKey = 'P3KOuFXufMharYFTImPXLhktGUr0AfPt';
	const MAP_BOX_TOKEN = "pk.eyJ1Ijoid2VzbGxleWxpbWExMyIsImEiOiJjbGZ2OXpkeDgwNTR3M2ZtZ2Jpa28xbGJzIn0.8y81dsDjwreDol7C7ArmCw";
	const accuweatherURL = 'http://dataservice.accuweather.com';

	const weatherData = {
		city: '',
		state: '',
		country: '',
		temperature: '',
		text_climate: '',
		icon_climate: '',
	};

	function toFillClimate(city, state, country, temperature, text_climate, icon_climate) {
		let text_location = `${city}, ${state}. ${country}`;

		$('#texto_local').text(text_location);
		$('#texto_clima').text(text_climate);
		$('#texto_temperatura').html(`${String(temperature)}&deg;`);
		$('#icone_clima').css('background-image', `url('${icon_climate}')`);
	}

	function generateGraph(hourly, temperature) {
		//!  Data retrieved https://en.wikipedia.org/wiki/List_of_cities_by_average_temperature
		Highcharts.chart('hourly_chart', {
			chart: {
				type: 'spline',
			},
			title: {
				text: 'Temperatura hora a hora',
			},
			xAxis: {
				categories: hourly,
				accessibility: {
					description: 'Months of the year',
				},
			},
			yAxis: {
				title: {
					text: 'Temperatura (ºC)',
				},
				labels: {
					formatter: function () {
						return this.value + '°';
					},
				},
			},
			tooltip: {
				crosshairs: true,
				shared: true,
			},
			plotOptions: {
				spline: {
					marker: {
						radius: 4,
						lineColor: '#666666',
						lineWidth: 1,
					},
				},
			},
         series: [
            {
               showInLegend: false,
					data: temperature,
				},
			],
		});
	}

   function getPrevisionHourAnHour(local_code) {

		const URL = `
			${accuweatherURL}/forecasts/v1/hourly/12hour/${local_code}?apikey=${accuweatherAPIKey}&language=pt-br&metric=true
		`;

		$.ajax({
			url: URL,
			type: 'GET',
			dataType: 'json',
			success: function (data) {

				let hourly = [];
				let temperature = [];

				for (let index = 0; index < data.length; index++){

					let hour_data = new Date(data[index].DateTime).getHours();

					hourly.push(`${String(hour_data)}h`);
					temperature.push(data[index].Temperature.Value);

					generateGraph(hourly, temperature);
					$(".refresh-loader").fadeOut();

				}


			},
			error: function () {
				console.log('Erro');
				generateWarningOfErro("Erro ao obter previsão hora a hora!");
			},
		});
   }

	function toFillPrevisionFiveOfDays(prevision) {
		$('#info_5dias').html('');
		const days__weeks = [
			'Domingo',
			'Segunda-feira',
			'Terça-feria',
			'Quarta-feria',
			'Quinta-feria',
			'Sexta-feria',
			'Sábado',
		];

		for (let i = 0; i < prevision.length; i++) {
			let date_today = new Date(prevision[i].Date);
			let days_week = days__weeks[date_today.getDay()];
			let icon_number =
				prevision[i].Day.Icon <= 9
					? '0' + String(prevision[i].Day.Icon)
					: String(prevision[i].Day.Icon);

			iconClimate =
				'https://developer.accuweather.com/sites/default/files/' + icon_number + '-s.png';

			maximum = String(prevision[i].Temperature.Maximum.Value);
			minimum = String(prevision[i].Temperature.Minimum.Value);

			elementHtmlDay = `
            <div class="day col">
               <div class="day_inner">
                  <div class="dayname">${days_week}</div>
                  <div
                     style="background-image: url('${iconClimate}');"
                     class="daily_weather_icon"
                  ></div>
                  <div class="max_min_temp">${minimum}&deg; / ${maximum}&deg;</div>
               </div>
            </div>
         `;

			$('#info_5dias').append(elementHtmlDay);
			elementHtmlDay = '';
		}
	}

	function getPrevisionFiveOfDays(location_code) {
		const URL = `
         ${accuweatherURL}/forecasts/v1/daily/5day/${location_code}?apikey=${accuweatherAPIKey}&language=pt-br&metric=true
      `;

		$.ajax({
			url: URL,
			type: 'GET',
			dataType: 'json',
			success: function (data) {

				const temp_maximum = data.DailyForecasts[0].Temperature.Maximum.Value;
				const temp_minimum = data.DailyForecasts[0].Temperature.Minimum.Value;

				const min_max = `
               ${String(temp_maximum)}&deg; / ${String(temp_minimum)}&deg;
            `;

				$('#texto_max_min').html(min_max);

				toFillPrevisionFiveOfDays(data.DailyForecasts);
			},
			error: function () {
				console.log('Erro');
				generateWarningOfErro("Erro ao obter previsão de 5 dias!");
			},
		});
	}

	function getTimeCurrent(location_code) {
		const URL = `${accuweatherURL}/currentconditions/v1/${location_code}?apikey=${accuweatherAPIKey}&language=pt-br`;

		$.ajax({
			url: URL,
			type: 'GET',
			dataType: 'json',
			success: function (data) {

				let icon_number =
					data[0].WeatherIcon <= 9
						? '0' + String(data[0].WeatherIcon)
						: String(data[0].WeatherIcon);

				weatherData.temperature = data[0].Temperature.Metric.Value;
				weatherData.text_climate = data[0].WeatherText;
				weatherData.icon_climate =
					'https://developer.accuweather.com/sites/default/files/' + icon_number + '-s.png';

				toFillClimate(
					weatherData.city,
					weatherData.state,
					weatherData.country,
					weatherData.temperature,
					weatherData.text_climate,
					weatherData.icon_climate,
				);
			},
			error: function () {
				console.log('Erro');
				generateWarningOfErro("Erro ao obter clima atual!");
			},
		});
	}

	function getLocationUser(lat, long) {
		$.ajax({
			url: `${accuweatherURL}/locations/v1/cities/geoposition/search?apikey=${accuweatherAPIKey}&q=${lat}%2C${long}&language=pt-br`,
			type: 'GET',
			dataType: 'json',
			success: function (data) {

				try {
					weatherData.city = data.ParentCity.LocalizedName;
				} catch (error) {
					weatherData.city = data.LocalizedName;
				}

				weatherData.state = data.AdministrativeArea.LocalizedName;
				weatherData.country = data.Country.LocalizedName;

				let location_code = data.Key;
				getTimeCurrent(location_code);
				getPrevisionFiveOfDays(location_code);
				getPrevisionHourAnHour(location_code);
			},
			error: function () {
				console.log('Erro');
				generateWarningOfErro("Erro no código no local!");
			},
		});
	}

	function getCoordinatesOfSearch(input) {

		input = encodeURI(input);
		const MAP_BOX_URL = `https://api.mapbox.com/geocoding/v5/mapbox.places/${input}.json?access_token=${MAP_BOX_TOKEN}`;

		$.ajax({
			url: MAP_BOX_URL,
			type: 'GET',
			dataType: 'json',
			success: function (data) {

				try {

					let long = data.features[0].geometry.coordinates[0];
					let lat = data.features[0].geometry.coordinates[1];
					getLocationUser(lat, long);

				} catch (error) {
					generateWarningOfErro("Erro na pesquisa de localização!");
				}

			},
			error: function () {
				generateWarningOfErro("Erro na pesquisa de localização!");
			},
		});
	}

	function getCoordinatesOfIP() {
		const lat_default = -23.551614;
		const long_default = -46.510871;

		$.ajax({
			url: `http://www.geoplugin.net/json.gp`,
			type: 'GET',
			dataType: 'json',
			success: function (data) {
				const geoLocation = {
					lat: data.geoplugin_latitude,
					long: data.geoplugin_longitude,
				};

				if (geoLocation.lat && geoLocation.long) {
					getLocationUser(geoLocation.lat, geoLocation.long);
				} else {
					getLocationUser(lat_default, long_default);
				}
			},
			error: function () {
				console.log('Erro of location!');
				getLocationUser(lat_default, long_default);
			},
		});
	}

	function generateWarningOfErro(message) {
		if (!message) {
			message = "Erro na Solicitação!";
		}

		$(".refresh-loader").hide();
		$("#warning_error").text(message);
		$("#warning_error").slideDown();

		window.setTimeout(() => {
			$("#warning_error").slideUp();
		}, 4000);
	}

	getCoordinatesOfIP();

	$("#search-button").click(() => {
		$(".refresh-loader").show();
		let local = $("#local").val();
		if (local) {
			getCoordinatesOfSearch(local);
		} else {
			alert("Local invalid!");
		}
	});

	$("input#local").on("keypress", (event) => {
		if (event.which == 13) {
			$(".refresh-loader").show();
			let local = $("#local").val();
			if (local) {
				getCoordinatesOfSearch(local);
			} else {
				alert("Local invalid!");
			}
		}

	});
});
