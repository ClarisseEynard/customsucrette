$(document).ready(function() {
	var page = checkURL();
	drawPage(page);
});

function checkURL() {
	var url = window.location.search;

	if (url != "") {
		if (url.includes("general")) {
			return "general";
		} else if (url.includes("form")) {
			return "form";
		} else if (url.includes("wanted")) {
			return "wanted";
		} else {
			history.pushState(null, "", "?q=general");
			return "general";
		};

	} else {
		history.pushState(null, "", "?q=general");
		return "general";
	};

};

function drawPage(type) {
	$("#page-dynamic-submit").html('');

	if (type == "general") {
		$("#page-dynamic-submit").append('<div class="section-page info"></div>');
		$(".section-page.info").append('<div style="position:  relative; display: inline-block;"><h3><div class="paper-clip-title"><div class="title-container"><div class="trombone"></div><span>Aide-moi à compléter le dressing !</span></div></div></h3></div>');
		$(".section-page.info").append("<div class=\"page-main-content\"><div class=\"card\"><p>Comme vous le savez, le dressing vient à peine de démarrer et il manque encore plusieurs vêtements. On recherche actuellement les tenues d'épisodes (indiquées dans l'onglet « On recherche ») et certains cadeaux de la fée non encore répertoriés.</p><p>Si tu as un vêtement qui n'est pas encore dans le dressing, je t'invite à remplir le formulaire dans l'onglet du même nom.</p><p>Le formulaire est ouvert pour que tu organises les informations comme tu le souhaites ; assure-toi simplement qu'elles sont correctes.</p></div></div>");

		$("#page-dynamic-submit").append('<div class="section-page requirement"></div>');
		$(".section-page.requirement").append('<div style="position: relative; display: inline-block;"><h3><div class="paper-clip-title"><div class="title-container"><div class="trombone"></div><span>Informations requises</span></div></div></h3></div>');
		$(".section-page.requirement").append('<div class="page-main-content"><div class="card"><ul><li>Saison : Lycée / Université / Amour</li><li>Noms des vêtements.</li><li>Catégories des vêtements.</li><li>Liens vers les variations de couleurs.</li></ul></div></div>');

		$(".tab").eq(0).addClass("active");

	} else if (type == "form") {
		$("#page-dynamic-submit").append('<div class="section-page form"></div>');
		$(".section-page.form").append('<div style="position:  relative; display: inline-block;"><h3><div class="paper-clip-title"><div class="title-container"><div class="trombone"></div><span>Remplis le formulaire</span></div></div></h3></div>');
		$(".section-page.form").append('<div class="page-main-content" style="text-align: center;"><iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfQlhXLEa37uIz2UxDZhwVOoGtgzXpEJr0ylJZbnK2xRU2LqA/viewform?embedded=true" width="640" height="500" frameborder="0" marginheight="0" marginwidth="0">Chargement…</iframe></div>');

		$(".tab").eq(2).addClass("active");

	} else if (type == "wanted") {
		$("#page-dynamic-submit").append('<div class="section-page wanted"></div>');
		$(".tab").eq(1).addClass("active");

		$(".section-page.wanted").append('<div style="position:  relative; display: inline-block;"><h3><div class="paper-clip-title"><div class="title-container"><div class="trombone"></div><span>Tenues du lycée</span></div></div></h3></div>');
		$(".section-page.wanted").append('<div class="page-main-content"><div class="card"><p>On recherche tous les vêtements et accessoires de ces tenues, uniquement dans ces couleurs (fournis uniquement les liens des images) :</p><div class="sets s1"></div></div></div>');

		var arrayS1 = [];

		if (arrayS1.length > 0) {
			for (i = 0; i < arrayS1.length; i++) {
				var name = arrayS1[i];
				name = name.replace("../assets/img/sets/s1/", "");
				name = name.replace(".png", "");
				name = name.replace(/_/g, " ");
				$(".sets.s1").append('<a href="' + arrayS1[i] + '" target="_blank" title="' + name + '"><img style="width: 20%;" src="' + arrayS1[i] + '"></a>');
			};
		} else {
			$(".card p").eq(0).html('<i>Rien pour le moment.</i>');
		}

		$(".section-page.wanted").append("<div style=\"position:  relative; display: inline-block;\"><h3><div class=\"paper-clip-title\"><div class=\"title-container\"><div class=\"trombone\"></div><span>Tenues de l'université</span></div></div></h3></div>");
		$(".section-page.wanted").append('<div class="page-main-content"><div class="card"><p>On recherche tous les vêtements et accessoires de ces tenues, uniquement dans ces couleurs (fournis uniquement les liens des images) :</p><div class="sets s2"></div></div></div>');

		var arrayS2 = [];

		if (arrayS2.length > 0) {
			for (i = 0; i < arrayS2.length; i++) {
				var name = arrayS2[i];
				name = name.replace("../assets/img/sets/s2/", "");
				name = name.replace(".png", "");
				name = name.replace(/_/g, " ");
				$(".sets.s2").append('<a href="' + arrayS2[i] + '" target="_blank" title="' + name + '"><img style="width: 20%;" src="' + arrayS2[i] + '"></a>');
			};
		} else {
			$(".card p").eq(1).html('<i>Rien pour le moment.</i>');
		}

		$(".section-page.wanted").append("<div style=\"position:  relative; display: inline-block;\"><h3><div class=\"paper-clip-title\"><div class=\"title-container\"><div class=\"trombone\"></div><span>Tenues d'Amour</span></div></div></h3></div>");
		$(".section-page.wanted").append('<div class="page-main-content"><div class="card"><p>On recherche uniquement les vêtements dans ces couleurs précises :</p><div class="sets s3"></div></div></div>');

		var arrayS3 = [];

		if (arrayS3.length > 0) {
			for (i = 0; i < arrayS3.length; i++) {
				var name = arrayS2[i];
				name = name.replace("../assets/img/sets/s3/", "");
				name = name.replace(".png", "");
				name = name.replace(/_/g, " ");
				$(".sets.s3").append('<a href="' + arrayS3[i] + '" target="_blank" title="' + name + '"><img style="width: 20%;" src="' + arrayS3[i] + '"></a>');
			};
		} else {
			$(".card p").eq(2).html('<i>Rien pour le moment.</i>');
		};
	};
};

$(function() {
	$(".tab").click(function() {
		var clase = $(this).attr("class");

		if (!clase.includes("active")) {
			$(".tab.active").removeClass("active");
			$(this).addClass("active");

			var string = $(this).find("span").text();

			if (string == "Général") {
				history.pushState(null, "", "?q=general");
				drawPage("general");
			} else if (string == "Formulaire") {
				history.pushState(null, "", "?q=form");
				drawPage("form");
			} else if (string == "On recherche") {
				history.pushState(null, "", "?q=wanted");
				drawPage("wanted");
			};
		};
	});

});
