$(function () {
	// *** APIs ***
	//* clima, previsão 12 horas e previsão 5 dias: https://developer.accuweather.com/apis
	//* pegar coordenadas geográficas pelo nome da cidade: https://docs.mapbox.com/api/
	//* pegar coordenadas do IP: http://www.geoplugin.net
	//* gerar gráficos em JS: https://www.highcharts.com/demo

	const accuweatherAPIKey = 'P3KOuFXufMharYFTImPXLhktGUr0AfPt';
   const accuweatherURL = 'http://dataservice.accuweather.com';

   const weatherData = {
      city: "",
      state: "",
      country: "",
      temperature: "",
      text_climate: "",
      icon_climate: "",
   }

   function toFillClimate(city, state, country, temperature, text_climate, icon_climate) {
      let text_location = `${city}, ${state}. ${country}`;

      $("#texto_local").text(text_location);
      $("#texto_clima").text(text_climate);
      $("#texto_temperatura").html(`${String(temperature)}&deg;`);
      $("#icone_clima").css("background-image", `url('${icon_climate}')`)
   }

   function toFillPrevisionFiveOfDays(prevision) {
      $("#info_5dias").html("");

      for (let i = 0; i < prevision.length; i++){

         let days_week = "days week";
         let icon_number = prevision[i].Day.Icon <= 9 ? "0" + String(prevision[i].Day.Icon) : String(prevision[i].Day.Icon);

         iconClimate = `
            https://developer.accuweather.com/sites/default/files/${icon_number}-s.png
         `;

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

         $("#info_5dias").append(elementHtmlDay);
         elementHtmlDay = "";
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
            console.log("Prevision Forecast:", data);

            const min_max = `
               ${String(data.DailyForecasts[0].Temperature.Minimum.Value)}&deg;
               /
               ${String(data.DailyForecasts[0].Temperature.Maximum.Value)}&deg;
            `;

            $("#texto_max_min").html(min_max);

            toFillPrevisionFiveOfDays(data.DailyForecasts);

			},
			error: function () {
				console.log('Erro');
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
            console.log("CurrentConditions:", data);

            let icon_number = data[0].WeatherIcon <= 9 ? "0" + String(data[0].WeatherIcon) : String(data[0].WeatherIcon);

            weatherData.temperature = data[0].Temperature.Metric.Value;
            weatherData.text_climate = data[0].WeatherText;
            weatherData.icon_climate = `
               https://developer.accuweather.com/sites/default/files/${icon_number}-s.png
            `;

            toFillClimate(
               weatherData.city,
               weatherData.state,
               weatherData.country,
               weatherData.temperature,
               weatherData.text_climate,
               weatherData.icon_climate
            )
			},
			error: function () {
				console.log('Erro');
			},
		});
	}

	function getLocationUser(lat, long) {
		$.ajax({
			url: `${accuweatherURL}/locations/v1/cities/geoposition/search?apikey=${accuweatherAPIKey}&q=${lat}%2C${long}&language=pt-br`,
			type: 'GET',
			dataType: 'json',
         success: function (data) {

            console.log("GeoPosition:", data);

            try {
               weatherData.city = data.ParentCity.LocalizedName;
            } catch (error) {
               weatherData.city = data.LocalizedName;
            }

            weatherData.state = data.AdministrativeArea.LocalizedName;
            weatherData.country = data.Country.LocalizedName;

            let location_code = data.Key;
            getTimeCurrent(location_code);
            getPrevisionFiveOfDays(location_code)

			},
			error: function () {
				console.log('Erro of location!');
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
            }

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

   getCoordinatesOfIP();



});
