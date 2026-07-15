il.InteractiveVideoYoutubePlayer = (function (scope) {
	'use strict';

	var pub = {}, pro = {};

	// Persistent, browser-wide consent for embedding YouTube ("two-click" solution).
	// As long as this is not set, no request is ever made to YouTube/Google.
	var CONSENT_KEY = 'il_xvid_youtube_consent';

	pro.hasConsent = function () {
		try {
			return window.localStorage.getItem(CONSENT_KEY) === '1';
		} catch (e) {
			return false;
		}
	};

	pro.storeConsent = function () {
		try {
			window.localStorage.setItem(CONSENT_KEY, '1');
		} catch (e) {}
	};

	// Actually embed the YouTube player. This is the only place that contacts
	// YouTube, so it must never run before consent was given.
	pro.buildPlayer = function (player_id) {
		var value = il.InteractiveVideo[player_id];
		if (!value) {
			return;
		}

		// Reveal the real player container and remove the consent overlay.
		$('#iv_youtube_consent_' + player_id).addClass('iv_youtube_consent_hidden');
		$('.iv_metadata[data-plyr-player-id="' + player_id + '"]').removeClass('iv_youtube_consent_hidden');

		il.InteractiveVideoPlayerFunction.appendInteractionEvents(player_id);
		var player   = null,
			seekTime = 0,
			interval = null;
		il.InteractiveVideo.last_stopPoint = -1;
		player =  new Plyr('#' + player_id, plyr_global_config);
		il.InteractiveVideo[player_id].player =	player;
		il.InteractiveVideo[player_id].player.on('ready', event => {
			il.InteractiveVideoPlayerAbstract.config[player_id] = {
				pauseCallback: (function () {
					player.pause();
				}),
				playCallback: (function () {
					player.play();
				}),
				durationCallback: (function () {
					return player.duration
				}),
				currentTimeCallback: (function () {
					return player.currentTime
				}),
				setCurrentTimeCallback: (function (time) {
					player.currentTime = time;
				}),
				initPlayerCallback         : il.InteractiveVideoYoutubePlayer.initPlayer
			};
			il.InteractiveVideoPlayerAbstract.readyCallback(player_id, '.plyr__poster');
			il.InteractiveVideo[player_id].player.on('play', event => {
				il.InteractiveVideoPlayerAbstract.play(player_id);
			});
			il.InteractiveVideo[player_id].player.on('seeked', event => {
				clearInterval(interval);
				il.InteractiveVideoPlayerFunction.seekingEventHandler(player_id);
			});
			il.InteractiveVideo[player_id].player.on('pause', event => {
				clearInterval(interval);
				il.InteractiveVideo.last_time = il.InteractiveVideoPlayerAbstract.currentTime(player_id);
			});
			il.InteractiveVideo[player_id].player.on('ended', event => {
				il.InteractiveVideoPlayerAbstract.videoFinished(player_id);
			});
			il.InteractiveVideo[player_id].player.on('playing', event => {
				interval = setInterval(function () {
					il.InteractiveVideoPlayerFunction.playingEventHandler(interval, player_id);
				}, 500);
			});
		});
	};

	// Wire the consent button of a not-yet-embedded player.
	pro.bindConsent = function (player_id) {
		$('#iv_youtube_consent_' + player_id + ' .iv_youtube_consent_btn')
			.off('click.ivconsent')
			.on('click.ivconsent', function (e) {
				e.preventDefault();
				pro.storeConsent();
				// One consent covers every YouTube video on the page.
				pub.buildAllConsented();
			});
	};

	// Embed every YouTube player currently known (used right after consent).
	pub.buildAllConsented = function () {
		$.each(il.InteractiveVideo, function (player_id, value) {
			if (value && value.hasOwnProperty("player_type") && value.player_type === "ytb") {
				pro.buildPlayer(player_id);
			}
		});
	};

	pub.initPlayer = function()
	{
		$.each(il.InteractiveVideo, function (player_id, value) {

			if (value && value.hasOwnProperty("player_type") && value.player_type === "ytb") {
				if (pro.hasConsent()) {
					pro.buildPlayer(player_id);
				} else {
					pro.bindConsent(player_id);
				}
			}
		});
	};
	pub.protect = pro;
	return pub;

}(il));
document.addEventListener('DOMContentLoaded', function () {
	il.InteractiveVideoYoutubePlayer.initPlayer();
})
