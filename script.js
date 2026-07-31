document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    let audio = document.getElementById("bg-audio");
    if (!audio) {
        audio = document.createElement("audio");
        audio.id = "bg-audio";
        audio.src = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
        audio.loop = true;
        audio.autoplay = true;
        audio.volume = 0.2;
        document.body.appendChild(audio);
    }

    const resumeAudio = () => {
        if (audio && audio.play) {
            audio.play().catch(() => {});
        }
    };

    document.addEventListener("pointerdown", resumeAudio, { once: true });
    document.addEventListener("keydown", resumeAudio, { once: true });

    const gameGrid = document.getElementById("game-grid");
    const searchInput = document.getElementById("game-search");
    const resultsCount = document.getElementById("results-count");
    const genrePills = document.querySelectorAll("#genre-pills .category-pill");
    const sortSelect = document.getElementById("sort-select");
    const clearFiltersButton = document.getElementById("clear-filters");
    const chatRoomsContainer = document.getElementById("chat-rooms");
    const chatFeed = document.getElementById("chat-feed");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    let socket = null;

    const gameCatalog = Array.from({ length: 100 }, (_, index) => {
        const titles = [
            "Minecraft",
            "Forza Horizon 5",
            "Halo Infinite",
            "Sea of Thieves",
            "Microsoft Flight Simulator",
            "Age of Empires II",
            "Gears 5",
            "Ori and the Will of the Wisps",
            "Stardew Valley",
            "State of Decay 2",
            "Dragon Age: Inquisition",
            "The Elder Scrolls Online",
            "Fallout 4",
            "Cuphead",
            "DOOM",
            "Rocket League",
            "Kerbal Space Program",
            "Battletoads",
            "Skyrim Special Edition",
            "Tom Clancy's Rainbow Six Siege",
            "Call of Duty: Black Ops Cold War",
            "The Sims 4",
            "Hades",
            "Sonic Mania",
            "Control",
            "A Plague Tale: Innocence",
            "Mass Effect: Legendary Edition",
            "Hellblade: Senua's Sacrifice",
            "Dishonored 2",
            "Prey",
            "Monster Hunter: Rise",
            "Resident Evil Village",
            "Dying Light 2",
            "Far Cry 6",
            "Assassin's Creed Valhalla",
            "Watch Dogs: Legion",
            "Need for Speed Heat",
            "Forza Motorsport 7",
            "Riders Republic",
            "Tetris Effect",
            "Inside",
            "Hollow Knight",
            "Astroneer",
            "No Man's Sky",
            "The Long Dark",
            "Crackdown 3",
            "Destiny 2",
            "Evil West",
            "Sable",
            "Untitled Goose Game",
            "Apex Legends",
            "Back 4 Blood",
            "Lego Builder's Journey",
            "Psychonauts 2",
            "Dead Space",
            "Wreckfest",
            "Sonic Frontiers",
            "The Witcher 3",
            "Red Dead Redemption 2",
            "Cyberpunk 2077",
            "Horizon Zero Dawn",
            "Marvel's Guardians of the Galaxy",
            "FIFA 23",
            "NBA 2K23",
            "Mortal Kombat 11",
            "WWE 2K23",
            "The Touryst",
            "PowerWash Simulator",
            "My Time at Portia",
            "One Piece: World Seeker",
            "The Escapists 2",
            "Yakuza: Like a Dragon",
            "Metroid Dread",
            "Bubsy: Paws on Fire",
            "Ghostrunner",
            "Wasteland 3",
            "The Ascent",
            "Cities: Skylines",
            "The Last Campfire",
            "Shadow of the Tomb Raider",
            "Tunic",
            "Wolfenstein: Youngblood",
            "Lego Harry Potter Collection",
            "Farming Simulator 22",
            "Naraka: Bladepoint",
            "RimWorld",
            "A Little to the Left",
            "Slay the Spire",
            "To the Moon",
            "Elden Ring",
            "God of War",
            "Starfield",
            "Diablo IV",
            "Fortnite",
            "Valorant",
            "Genshin Impact",
            "Palworld",
            "Phasmophobia",
            "Overwatch 2",
            "Brawl Stars",
            "Minecraft Dungeons",
            "NHL 24",
            "Borderlands 3",
            "12 Minutes",
            "Fist of the North Star",
            "Dungeons & Dragons: Dark Alliance",
            "Deathloop",
            "Mortal Shell",
            "Tomb Raider",
            "The Last of Us Part I",
            "Unpacking",
            "Rogue Legacy 2",
            "CrossCode"
        ];
        const genres = ["Action", "Racing", "Strategy", "Adventure", "Fantasy", "Arcade", "Simulation"];

        const title = titles[index];
        const genre = genres[index % genres.length];
        const description = `${genre} experience with polished visuals, quick missions, and high replay value.`;
        const price = Number((12 + (index % 20) + (index % 4) * 2).toFixed(2));
        const popularity = 100 - index;
        const image = `https://picsum.photos/seed/${encodeURIComponent(title)}/900/600`;
        const accessUrl = `https://www.microsoft.com/en-us/search/shop/games?q=${encodeURIComponent(title)}`;

        return {
            title,
            genre,
            description,
            price,
            popularity,
            image,
            accessUrl
        };
    });

    const createGameCard = (game) => {
        const article = document.createElement("article");
        article.className = "tile-card";
        article.innerHTML = `
            <img src="${game.image}" alt="${game.title}">
            <div class="tile-copy">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
            </div>
            <div class="tile-meta">
                <span>$${game.price.toFixed(2)}</span>
                <a class="buy-btn" href="${game.accessUrl}" target="_blank" rel="noopener noreferrer">Download</a>
            </div>
        `;
        return article;
    };

    const chatRoomData = [
        { name: "Minecraft", gradient: "linear-gradient(135deg, #22c55e, #2563eb, #8b5cf6)" },
        { name: "Forza Horizon 5", gradient: "linear-gradient(135deg, #f97316, #ef4444, #fb7185)" },
        { name: "Halo Infinite", gradient: "linear-gradient(135deg, #facc15, #38bdf8, #22c55e)" },
        { name: "Sea of Thieves", gradient: "linear-gradient(135deg, #0ea5e9, #14b8a6, #84cc16)" }
    ];

    const storageKey = "pixelforge-chat-state";
    const chatState = {};
    let activeRoom = "Minecraft";

    const renderChatRooms = () => {
        if (!chatRoomsContainer) {
            return;
        }

        chatRoomsContainer.innerHTML = "";
        chatRoomData.forEach((room) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `chat-room-bar${activeRoom === room.name ? " active" : ""}`;
            button.style.background = room.gradient;
            button.textContent = room.name;
            button.addEventListener("click", () => {
                activeRoom = room.name;
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: "join", room: activeRoom, name: "You" }));
                }
                renderChatRooms();
                renderChatFeed();
            });
            chatRoomsContainer.appendChild(button);
        });
    };

    const renderChatFeed = () => {
        if (!chatFeed) {
            return;
        }

        const messages = chatState[activeRoom] || [];
        chatFeed.innerHTML = "";

        messages.forEach((message) => {
            const bubble = document.createElement("div");
            bubble.className = `chat-message${message.sender === "You" ? " self" : ""}`;
            bubble.innerHTML = `<strong>${message.sender}</strong><span>${message.text}</span>`;
            chatFeed.appendChild(bubble);
        });

        chatFeed.scrollTop = chatFeed.scrollHeight;
    };

    const persistChatState = () => {
        localStorage.setItem(storageKey, JSON.stringify(chatState));
    };

    if (chatForm && chatInput) {
        chatForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const text = chatInput.value.trim();
            if (!text) {
                return;
            }

            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "message", room: activeRoom, name: "You", text }));
            } else {
                const roomMessages = chatState[activeRoom] || [];
                roomMessages.push({ sender: "You", text });
                chatState[activeRoom] = roomMessages;
                persistChatState();
            }

            chatInput.value = "";
            renderChatFeed();
        });
    }

    try {
        socket = new WebSocket("ws://127.0.0.1:8765");
        socket.addEventListener("open", () => {
            socket.send(JSON.stringify({ type: "join", room: activeRoom, name: "You" }));
        });
        socket.addEventListener("message", (event) => {
            const payload = JSON.parse(event.data);
            if (payload.type === "sync") {
                chatState[payload.room] = payload.messages || [];
                if (activeRoom === payload.room) {
                    renderChatFeed();
                }
                persistChatState();
            }
            if (payload.type === "message") {
                const roomMessages = chatState[payload.room] || [];
                roomMessages.push(payload.message);
                chatState[payload.room] = roomMessages;
                if (activeRoom === payload.room) {
                    renderChatFeed();
                }
                persistChatState();
            }
        });
    } catch {
        renderChatFeed();
    }

    renderChatRooms();
    renderChatFeed();

    const sortGames = (games, sortMode) => {
        const sortedGames = [...games];

        if (sortMode === "price-asc") {
            sortedGames.sort((a, b) => a.price - b.price);
        } else if (sortMode === "price-desc") {
            sortedGames.sort((a, b) => b.price - a.price);
        } else {
            sortedGames.sort((a, b) => b.popularity - a.popularity);
        }

        return sortedGames;
    };

    const renderGames = (query = "", genre = "all", sortMode = "popular") => {
        if (!gameGrid) {
            return;
        }

        const term = query.trim().toLowerCase();
        const filteredGames = gameCatalog.filter((game) => {
            const matchesGenre = genre === "all" || game.genre === genre;
            const matchesSearch = !term || (
                game.title.toLowerCase().includes(term) ||
                game.genre.toLowerCase().includes(term) ||
                game.description.toLowerCase().includes(term)
            );

            return matchesGenre && matchesSearch;
        });

        const sortedGames = sortGames(filteredGames, sortMode);
        gameGrid.innerHTML = "";

        if (!sortedGames.length) {
            gameGrid.innerHTML = '<div class="empty-state">No games match your search. Try a different keyword or clear the filters.</div>';
        } else {
            sortedGames.forEach((game) => {
                gameGrid.appendChild(createGameCard(game));
            });
        }

        if (resultsCount) {
            resultsCount.textContent = `Showing ${sortedGames.length} game${sortedGames.length === 1 ? "" : "s"}`;
        }
    };

    renderGames();

    if (searchInput) {
        searchInput.addEventListener("input", (event) => {
            const currentGenre = document.querySelector("#genre-pills .category-pill.active")?.dataset.genre || "all";
            const currentSort = sortSelect ? sortSelect.value : "popular";
            renderGames(event.target.value, currentGenre, currentSort);
        });
    }

    genrePills.forEach((pill) => {
        pill.addEventListener("click", () => {
            genrePills.forEach((item) => item.classList.remove("active"));
            pill.classList.add("active");
            const chosenGenre = pill.dataset.genre || "all";
            const currentSearch = searchInput ? searchInput.value : "";
            const currentSort = sortSelect ? sortSelect.value : "popular";
            renderGames(currentSearch, chosenGenre, currentSort);
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener("change", (event) => {
            const currentSearch = searchInput ? searchInput.value : "";
            const currentGenre = document.querySelector("#genre-pills .category-pill.active")?.dataset.genre || "all";
            renderGames(currentSearch, currentGenre, event.target.value);
        });
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
            }
            genrePills.forEach((item) => item.classList.remove("active"));
            const firstPill = document.querySelector("#genre-pills .category-pill[data-genre='all']");
            if (firstPill) {
                firstPill.classList.add("active");
            }
            if (sortSelect) {
                sortSelect.value = "popular";
            }
            renderGames("", "all", "popular");
        });
    }

    const form = document.querySelector(".contact-form");
    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const nameField = form.querySelector("input[name='name']");
            const emailField = form.querySelector("input[name='email']");
            const phoneField = form.querySelector("input[name='phone']");
            const messageField = form.querySelector("textarea[name='message']");

            const name = nameField ? nameField.value.trim() : "there";
            const email = emailField ? emailField.value.trim() : "";
            const phone = phoneField ? phoneField.value.trim() : "";
            const message = messageField ? messageField.value.trim() : "";
            const whatsappNumber = "2348125625718";
            const whatsappMessage = encodeURIComponent(
                `Hello, my name is ${name}. Email: ${email}. Phone: ${phone}. Message: ${message}`
            );
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

            window.location.href = whatsappUrl;
            form.reset();
        });
    }
});
