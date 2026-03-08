// VerseWatch - Universe & Content Database
// Kaynak: Kullanıcının Excel listesi + eklemeler

const UNIVERSES = [
    {
        "id": "mcu",
        "name": "Marvel Sinematik Evreni",
        "shortName": "MCU",
        "color": "#e23636",
        "gradient": "linear-gradient(135deg, #e23636 0%, #7b1fa2 100%)",
        "icon": "🦸",
        "description": "Iron Man'dan günümüze Marvel film ve dizileri",
        "items": [
            {
                "id": "mcu-1",
                "title": "Captain America: The First Avenger",
                "year": 2011,
                "type": "movie",
                "tmdbId": 1771,
                "imdbId": "tt0458339",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-2",
                "title": "Iron Man",
                "year": 2008,
                "type": "movie",
                "tmdbId": 1726,
                "imdbId": "tt0371746",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-3",
                "title": "Iron Man 2",
                "year": 2010,
                "type": "movie",
                "tmdbId": 10138,
                "imdbId": "tt1228705",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-4",
                "title": "Thor",
                "year": 2011,
                "type": "movie",
                "tmdbId": 10195,
                "imdbId": "tt0800369",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-5",
                "title": "The Avengers",
                "year": 2012,
                "type": "movie",
                "tmdbId": 24428,
                "imdbId": "tt0848228",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-6",
                "title": "Iron Man 3",
                "year": 2013,
                "type": "movie",
                "tmdbId": 68721,
                "imdbId": "tt1300854",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-7",
                "title": "Thor: The Dark World",
                "year": 2013,
                "type": "movie",
                "tmdbId": 76338,
                "imdbId": "tt1981115",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-8",
                "title": "Captain America: The Winter Soldier",
                "year": 2014,
                "type": "movie",
                "tmdbId": 100402,
                "imdbId": "tt1843866",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-9",
                "title": "Guardians of the Galaxy",
                "year": 2014,
                "type": "movie",
                "tmdbId": 118340,
                "imdbId": "tt2015381",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-10",
                "title": "Guardians of the Galaxy Vol. 2",
                "year": 2017,
                "type": "movie",
                "tmdbId": 283995,
                "imdbId": "tt3896198",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-11",
                "title": "Avengers: Age of Ultron",
                "year": 2015,
                "type": "movie",
                "tmdbId": 99861,
                "imdbId": "tt2395427",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-12",
                "title": "Ant-Man",
                "year": 2015,
                "type": "movie",
                "tmdbId": 102899,
                "imdbId": "tt0478970",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-13",
                "title": "Captain America: Civil War",
                "year": 2016,
                "type": "movie",
                "tmdbId": 271110,
                "imdbId": "tt3498820",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-14",
                "title": "Doctor Strange",
                "year": 2016,
                "type": "movie",
                "tmdbId": 284053,
                "imdbId": "tt1228705",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-15",
                "title": "Black Widow",
                "year": 2021,
                "type": "movie",
                "tmdbId": 497698,
                "imdbId": "tt3480822",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-16",
                "title": "Black Panther",
                "year": 2018,
                "type": "movie",
                "tmdbId": 284054,
                "imdbId": "tt1825683",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-17",
                "title": "Spider-Man: Homecoming",
                "year": 2017,
                "type": "movie",
                "tmdbId": 315635,
                "imdbId": "tt2250912",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-18",
                "title": "Ant-Man and the Wasp",
                "year": 2018,
                "type": "movie",
                "tmdbId": 363088,
                "imdbId": "tt5095030",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-19",
                "title": "Captain Marvel",
                "year": 2019,
                "type": "movie",
                "tmdbId": 299537,
                "imdbId": "tt4154664",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-20",
                "title": "Thor: Ragnarok",
                "year": 2017,
                "type": "movie",
                "tmdbId": 338953,
                "imdbId": "tt3501632",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-21",
                "title": "Avengers: Infinity War",
                "year": 2018,
                "type": "movie",
                "tmdbId": 299536,
                "imdbId": "tt4154756",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-22",
                "title": "Avengers: Endgame",
                "year": 2019,
                "type": "movie",
                "tmdbId": 299534,
                "imdbId": "tt4154796",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-23",
                "title": "WandaVision",
                "year": 2021,
                "type": "series",
                "tmdbId": 85271,
                "imdbId": "tt10857160",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-24",
                "title": "The Falcon and the Winter Soldier",
                "year": 2021,
                "type": "series",
                "tmdbId": 88396,
                "imdbId": "tt10838180",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-25",
                "title": "Loki",
                "year": 2021,
                "type": "series",
                "tmdbId": 84958,
                "imdbId": "tt9140554",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-26",
                "title": "Spider-Man: Far From Home",
                "year": 2019,
                "type": "movie",
                "tmdbId": 429617,
                "imdbId": "tt6320628",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-27",
                "title": "Shang-Chi and the Legend of the Ten Rings",
                "year": 2021,
                "type": "movie",
                "tmdbId": 566525,
                "imdbId": "tt9376612",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-28",
                "title": "Eternals",
                "year": 2021,
                "type": "movie",
                "tmdbId": 524434,
                "imdbId": "tt9032400",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-29",
                "title": "Spider-Man: No Way Home",
                "year": 2021,
                "type": "movie",
                "tmdbId": 634649,
                "imdbId": "tt10872600",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-30",
                "title": "Doctor Strange in the Multiverse of Madness",
                "year": 2022,
                "type": "movie",
                "tmdbId": 453395,
                "imdbId": "tt9419884",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-31",
                "title": "Thor: Love and Thunder",
                "year": 2022,
                "type": "movie",
                "tmdbId": 616037,
                "imdbId": "tt10648342",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-32",
                "title": "Black Panther: Wakanda Forever",
                "year": 2022,
                "type": "movie",
                "tmdbId": 505642,
                "imdbId": "tt9114286",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-33",
                "title": "Ant-Man and the Wasp: Quantumania",
                "year": 2023,
                "type": "movie",
                "tmdbId": 640146,
                "imdbId": "tt10954600",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-34",
                "title": "Guardians of the Galaxy Vol. 3",
                "year": 2023,
                "type": "movie",
                "tmdbId": 447365,
                "imdbId": "tt6791350",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-35",
                "title": "The Marvels",
                "year": 2023,
                "type": "movie",
                "tmdbId": 609681,
                "imdbId": "tt10676048",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-36",
                "title": "Deadpool & Wolverine",
                "year": 2024,
                "type": "movie",
                "tmdbId": 533535,
                "imdbId": "tt6263850",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-37",
                "title": "Captain America: Brave New World",
                "year": 2025,
                "type": "movie",
                "tmdbId": 822119,
                "imdbId": "tt14513804",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-38",
                "title": "Thunderbolts*",
                "year": 2025,
                "type": "movie",
                "tmdbId": 986056,
                "imdbId": "tt20986658",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-39",
                "title": "The Guardians of the Galaxy Holiday Special",
                "year": 2022,
                "type": "movie",
                "tmdbId": 774752,
                "imdbId": "tt13623136",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-40",
                "title": "Werewolf by Night",
                "year": 2022,
                "type": "movie",
                "tmdbId": 927214,
                "imdbId": "tt15366746",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-41",
                "title": "Secret Invasion",
                "year": 2023,
                "type": "series",
                "tmdbId": 114479,
                "imdbId": "tt13143964",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-42",
                "title": "Echo",
                "year": 2024,
                "type": "series",
                "tmdbId": 118956,
                "imdbId": "tt15147414",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            },
            {
                "id": "mcu-43",
                "title": "Agatha All Along",
                "year": 2024,
                "type": "series",
                "tmdbId": 138502,
                "imdbId": "tt15562104",
                "posterCss": "linear-gradient(135deg, #e23636, #7b1fa2)"
            }
        ]
    },
    {
        "id": "xmen",
        "name": "X-Men Evreni",
        "shortName": "X-Men",
        "color": "#ffb300",
        "gradient": "linear-gradient(135deg, #1565c0 0%, #ffb300 100%)",
        "icon": "⚡",
        "description": "Fox'un X-Men film serisi",
        "items": [
            {
                "id": "xm-1",
                "title": "X-Men",
                "year": 2000,
                "type": "movie",
                "tmdbId": 36657,
                "imdbId": "tt0120903",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-2",
                "title": "X2: X-Men United",
                "year": 2003,
                "type": "movie",
                "tmdbId": 36668,
                "imdbId": "tt0290334",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-3",
                "title": "X-Men: The Last Stand",
                "year": 2006,
                "type": "movie",
                "tmdbId": 36669,
                "imdbId": "tt0376994",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-4",
                "title": "X-Men Origins: Wolverine",
                "year": 2009,
                "type": "movie",
                "tmdbId": 36643,
                "imdbId": "tt0458525",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-5",
                "title": "X-Men: First Class",
                "year": 2011,
                "type": "movie",
                "tmdbId": 49538,
                "imdbId": "tt1270798",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-6",
                "title": "The Wolverine",
                "year": 2013,
                "type": "movie",
                "tmdbId": 76170,
                "imdbId": "tt1430132",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-7",
                "title": "X-Men: Days of Future Past",
                "year": 2014,
                "type": "movie",
                "tmdbId": 127585,
                "imdbId": "tt1877832",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-8",
                "title": "Deadpool",
                "year": 2016,
                "type": "movie",
                "tmdbId": 293660,
                "imdbId": "tt1431045",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-9",
                "title": "X-Men: Apocalypse",
                "year": 2016,
                "type": "movie",
                "tmdbId": 246655,
                "imdbId": "tt3385516",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-10",
                "title": "Logan",
                "year": 2017,
                "type": "movie",
                "tmdbId": 263115,
                "imdbId": "tt3315342",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-11",
                "title": "Deadpool 2",
                "year": 2018,
                "type": "movie",
                "tmdbId": 383498,
                "imdbId": "tt5463162",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-12",
                "title": "Dark Phoenix",
                "year": 2019,
                "type": "movie",
                "tmdbId": 320288,
                "imdbId": "tt6565702",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-13",
                "title": "The New Mutants",
                "year": 2020,
                "type": "movie",
                "tmdbId": 430826,
                "imdbId": "tt4622812",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            },
            {
                "id": "xm-14",
                "title": "Deadpool & Wolverine",
                "year": 2024,
                "type": "movie",
                "tmdbId": 533535,
                "imdbId": "tt6263850",
                "posterCss": "linear-gradient(135deg, #1565c0, #ffb300)"
            }
        ]
    },
    {
        "id": "dceu",
        "name": "DC Genişletilmiş Evreni",
        "shortName": "DCEU",
        "color": "#1565c0",
        "gradient": "linear-gradient(135deg, #0d1b2a 0%, #1565c0 50%, #00bcd4 100%)",
        "icon": "🦇",
        "description": "Zack Snyder'dan günümüze DC film ve dizileri",
        "items": [
            {
                "id": "dc-1",
                "title": "Man of Steel",
                "year": 2013,
                "type": "movie",
                "tmdbId": 49521,
                "imdbId": "tt0770828",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-2",
                "title": "Batman v Superman: Dawn of Justice",
                "year": 2016,
                "type": "movie",
                "tmdbId": 209112,
                "imdbId": "tt2975590",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-3",
                "title": "Suicide Squad",
                "year": 2016,
                "type": "movie",
                "tmdbId": 297761,
                "imdbId": "tt1386697",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-4",
                "title": "Wonder Woman",
                "year": 2017,
                "type": "movie",
                "tmdbId": 297762,
                "imdbId": "tt0451279",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-5",
                "title": "Zack Snyder's Justice League",
                "year": 2021,
                "type": "movie",
                "tmdbId": 791373,
                "imdbId": "tt12361974",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-6",
                "title": "Aquaman",
                "year": 2018,
                "type": "movie",
                "tmdbId": 297802,
                "imdbId": "tt0478970",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-7",
                "title": "Shazam!",
                "year": 2019,
                "type": "movie",
                "tmdbId": 287947,
                "imdbId": "tt0448115",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-8",
                "title": "Birds of Prey",
                "year": 2020,
                "type": "movie",
                "tmdbId": 495764,
                "imdbId": "tt7713068",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-9",
                "title": "Wonder Woman 1984",
                "year": 2020,
                "type": "movie",
                "tmdbId": 464052,
                "imdbId": "tt8040250",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-10",
                "title": "The Suicide Squad",
                "year": 2021,
                "type": "movie",
                "tmdbId": 437375,
                "imdbId": "tt6334354",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-11",
                "title": "Peacemaker",
                "year": 2022,
                "type": "series",
                "tmdbId": 114472,
                "imdbId": "tt13146488",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-12",
                "title": "Black Adam",
                "year": 2022,
                "type": "movie",
                "tmdbId": 675353,
                "imdbId": "tt6443346",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-13",
                "title": "Shazam! Fury of the Gods",
                "year": 2023,
                "type": "movie",
                "tmdbId": 594767,
                "imdbId": "tt10151854",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-14",
                "title": "The Flash",
                "year": 2023,
                "type": "movie",
                "tmdbId": 298618,
                "imdbId": "tt0439572",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-15",
                "title": "Blue Beetle",
                "year": 2023,
                "type": "movie",
                "tmdbId": 565770,
                "imdbId": "tt15314262",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-16",
                "title": "Aquaman and the Lost Kingdom",
                "year": 2023,
                "type": "movie",
                "tmdbId": 572802,
                "imdbId": "tt9663764",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-17",
                "title": "Batman Begins",
                "year": 2005,
                "type": "movie",
                "tmdbId": 272,
                "imdbId": "tt0372784",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-18",
                "title": "The Dark Knight",
                "year": 2008,
                "type": "movie",
                "tmdbId": 155,
                "imdbId": "tt0468569",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-19",
                "title": "The Dark Knight Rises",
                "year": 2012,
                "type": "movie",
                "tmdbId": 49026,
                "imdbId": "tt1345836",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-20",
                "title": "The Batman",
                "year": 2022,
                "type": "movie",
                "tmdbId": 414906,
                "imdbId": "tt1877830",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-21",
                "title": "The Penguin",
                "year": 2024,
                "type": "series",
                "tmdbId": 194764,
                "imdbId": "tt15435876",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-22",
                "title": "Joker",
                "year": 2019,
                "type": "movie",
                "tmdbId": 475557,
                "imdbId": "tt7286456",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-23",
                "title": "Joker: Folie à Deux",
                "year": 2024,
                "type": "movie",
                "tmdbId": 1056360,
                "imdbId": "tt11315808",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-24",
                "title": "Watchmen",
                "year": 2009,
                "type": "movie",
                "tmdbId": 13183,
                "imdbId": "tt0409459",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-25",
                "title": "V for Vendetta",
                "year": 2005,
                "type": "movie",
                "tmdbId": 752,
                "imdbId": "tt0434409",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            },
            {
                "id": "dc-26",
                "title": "Constantine",
                "year": 2005,
                "type": "movie",
                "tmdbId": 561,
                "imdbId": "tt0348150",
                "posterCss": "linear-gradient(135deg, #0d1b2a, #1565c0)"
            }
        ]
    },
    {
        "id": "starwars",
        "name": "Star Wars Evreni",
        "shortName": "Star Wars",
        "color": "#ffd700",
        "gradient": "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #ffd700 100%)",
        "icon": "⚔️",
        "description": "A long time ago in a galaxy far, far away...",
        "items": [
            {
                "id": "sw-1",
                "title": "The Phantom Menace",
                "year": 1999,
                "type": "movie",
                "tmdbId": 1893,
                "imdbId": "tt0120915",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-2",
                "title": "Attack of the Clones",
                "year": 2002,
                "type": "movie",
                "tmdbId": 1894,
                "imdbId": "tt0121765",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-3",
                "title": "Revenge of the Sith",
                "year": 2005,
                "type": "movie",
                "tmdbId": 1895,
                "imdbId": "tt0121766",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-4",
                "title": "A New Hope",
                "year": 1977,
                "type": "movie",
                "tmdbId": 11,
                "imdbId": "tt0076759",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-5",
                "title": "The Empire Strikes Back",
                "year": 1980,
                "type": "movie",
                "tmdbId": 1891,
                "imdbId": "tt0080684",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-6",
                "title": "Return of the Jedi",
                "year": 1983,
                "type": "movie",
                "tmdbId": 1892,
                "imdbId": "tt0086190",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-7",
                "title": "The Force Awakens",
                "year": 2015,
                "type": "movie",
                "tmdbId": 140607,
                "imdbId": "tt2488496",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-8",
                "title": "The Last Jedi",
                "year": 2017,
                "type": "movie",
                "tmdbId": 181808,
                "imdbId": "tt2527336",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-9",
                "title": "The Rise of Skywalker",
                "year": 2019,
                "type": "movie",
                "tmdbId": 181812,
                "imdbId": "tt2527338",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-10",
                "title": "Rogue One",
                "year": 2016,
                "type": "movie",
                "tmdbId": 330459,
                "imdbId": "tt3748528",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-11",
                "title": "Solo: A Star Wars Story",
                "year": 2018,
                "type": "movie",
                "tmdbId": 348350,
                "imdbId": "tt3778644",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-12",
                "title": "The Mandalorian",
                "year": 2019,
                "type": "series",
                "tmdbId": 82856,
                "imdbId": "tt8111088",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-13",
                "title": "The Book of Boba Fett",
                "year": 2021,
                "type": "series",
                "tmdbId": 115036,
                "imdbId": "tt10470734",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-14",
                "title": "Obi-Wan Kenobi",
                "year": 2022,
                "type": "series",
                "tmdbId": 92830,
                "imdbId": "tt8466564",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-15",
                "title": "Andor",
                "year": 2022,
                "type": "series",
                "tmdbId": 83867,
                "imdbId": "tt9253284",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-16",
                "title": "Ahsoka",
                "year": 2023,
                "type": "series",
                "tmdbId": 114461,
                "imdbId": "tt13622776",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            },
            {
                "id": "sw-17",
                "title": "Skeleton Crew",
                "year": 2024,
                "type": "series",
                "tmdbId": 202096,
                "imdbId": "tt20349286",
                "posterCss": "linear-gradient(135deg, #0a0a0a, #ffd700)"
            }
        ]
    },
    {
        "id": "monsterverse",
        "name": "MonsterVerse",
        "shortName": "MonsterVerse",
        "color": "#4caf50",
        "gradient": "linear-gradient(135deg, #1b5e20 0%, #4caf50 100%)",
        "icon": "🦖",
        "description": "Godzilla, Kong ve devlerin evreni",
        "items": [
            {
                "id": "mv-1",
                "title": "Godzilla",
                "year": 2014,
                "type": "movie",
                "tmdbId": 124905,
                "imdbId": "tt0432232",
                "posterCss": "linear-gradient(135deg, #1b5e20, #4caf50)"
            },
            {
                "id": "mv-2",
                "title": "Kong: Skull Island",
                "year": 2017,
                "type": "movie",
                "tmdbId": 293167,
                "imdbId": "tt3731562",
                "posterCss": "linear-gradient(135deg, #1b5e20, #4caf50)"
            },
            {
                "id": "mv-3",
                "title": "Godzilla: King of the Monsters",
                "year": 2019,
                "type": "movie",
                "tmdbId": 373571,
                "imdbId": "tt3741700",
                "posterCss": "linear-gradient(135deg, #1b5e20, #4caf50)"
            },
            {
                "id": "mv-4",
                "title": "Godzilla vs. Kong",
                "year": 2021,
                "type": "movie",
                "tmdbId": 399566,
                "imdbId": "tt5034838",
                "posterCss": "linear-gradient(135deg, #1b5e20, #4caf50)"
            },
            {
                "id": "mv-5",
                "title": "Monarch: Legacy of Monsters",
                "year": 2023,
                "type": "series",
                "tmdbId": 202411,
                "imdbId": "tt17220262",
                "posterCss": "linear-gradient(135deg, #1b5e20, #4caf50)"
            },
            {
                "id": "mv-6",
                "title": "Godzilla x Kong: The New Empire",
                "year": 2024,
                "type": "movie",
                "tmdbId": 823464,
                "imdbId": "tt14539740",
                "posterCss": "linear-gradient(135deg, #1b5e20, #4caf50)"
            }
        ]
    }
];

// Persistence helpers
const STORAGE_KEY = 'versewatch_watched';

function getWatched() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
}

function setWatched(watched) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watched));
}

function toggleWatched(itemId) {
    const watched = getWatched();
    watched[itemId] = !watched[itemId];
    setWatched(watched);
    return watched[itemId];
}

function isWatched(itemId) {
    return !!getWatched()[itemId];
}

function getUniverseStats(universe) {
    const watched = getWatched();
    const total = universe.items.length;
    const done = universe.items.filter(i => watched[i.id]).length;
    return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
}
