// ===================== IMPORT =====================
import pino from 'pino';
import sharp from 'sharp';
import fs from 'fs';
import axios from 'axios';
import yts from 'yt-search';
import ytdl from 'ytdl-core';
import archiver from 'archiver';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  fileURLToPath
} from 'url';
import {
  default as makeSocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
  } from '@whiskeysockets/baileys';

  // Import fungsi dari file lokal
  import {
    tiktokDl
  } from './lib/tiktokdl.js';
  import {
    loadDB,
    saveDB
  } from './lib/database.js';
  import {
    exec
  } from 'child_process';
  import {
    promisify
  } from 'util';

  const execAsync = promisify(exec);

  // ===================== PENGATURAN =====================

  // nomor bot untuk pairing
  const nomorBot = "6283891977423"

  const ownerList = [
    "6283866317462",
    "6283866317501"
  ]

  // BOTMODE dengan default value
  let botMode = loadDB("./lib/database/botMode.json")
  if (!botMode || botMode.active === undefined) {
    botMode = {
      active: true
    }
    saveDB("./lib/database/botMode.json", botMode)
  }

  const hargaCommand = loadDB("./lib/database/listHargaCommand.json") || {}

  const kataToxic = loadDB("./lib/database/kataToxic.json") || {}
  const kataToxicPrem = loadDB("./lib/database/kataToxicPrem.json") || {}
  const kataToxicPisah = kataToxic.kataToxicPisah || []
  const kataToxicGabung = kataToxic.kataToxicGabung || []
  const kataToxicPisahPrem = kataToxicPrem.kataToxicPisah || []
  const kataToxicGabungPrem = kataToxicPrem.kataToxicGabung || []
  const pkg = loadDB("./package.json")
  const versionBot = pkg.version
  const namaBot = pkg.name
  const namaOwner = pkg.owner
  const update = pkg.update

  let antiToxic = loadDB("./lib/database/antiToxic.json")
  let antiLink = loadDB("./lib/database/antiLink.json")
  let antiChannel = loadDB("./lib/database/antiChannel.json")
  let toxicLimitDB = loadDB("./lib/database/toxicLimit.json") || {}
  let toxicTracker = loadDB("./lib/database/trackerToxic.json") || {}
  let premiumGroup = loadDB("./lib/database/premiumGroup.json") || {}
  let userSaldo = loadDB("./lib/database/saldo.json") || {};
  let userEmas = loadDB("./lib/database/emas.json");
  let userBtc = loadDB("./lib/database/btc.json");

  const spamTracker = {}
  const stickerSpamTracker = {}
  const thumbnailData = loadDB("./lib/thumbnail.json");
  const thumbnailList = thumbnailData.thumbnails || [];
  const premiumOnly = ["antilink", "scgc", "ytmp4", "gemini"]
  let fishInventory = loadDB("./lib/database/fishInventory.json") || {};
  let marketplace = loadDB("./lib/database/marketplace.json") || {};
  let fishCatalog = loadDB("./lib/database/fishCatalog.json") || {};
  let userLocation = loadDB("./lib/database/userLocation.json") || {};
  let afkData = loadDB("./lib/database/afkFish.json") || {};
  let afkIntervals = loadDB("./lib/database/fishInterval.json") || {}
  let kudetaData = loadDB("./lib/database/kudeta.json") || {};
  let users = loadDB("./lib/database/users.json") || {};
  let globalSaldo = loadDB("./lib/database/globalSaldo.json") || {};
  let globalFishInventory = loadDB("./lib/database/globalFishInventory.json") || {};
  let globalVillages = loadDB("./lib/database/globalVillages.json") || {};
  let globalMarketplace = loadDB("./lib/database/globalMarketplace.json") || {};
  let globalBattles = loadDB("./lib/database/globalBattles.json") || {};
  let globalClaimCooldown = loadDB("./lib/database/globalClaimCooldown.json") || {};
  // ===================== DATABASE BANK =====================
  let bankData = loadDB("./lib/database/bank.json") || {};

  if (!bankData.accounts) bankData.accounts = {};
  if (!bankData.transactions) bankData.transactions = [];
  if (!bankData.settings) bankData.settings = {
    minDeposit: 10000,
    minWithdraw: 5000,
    interestRate: 0.5,
    adminFee: 1000
  };
  // ===================== DATABASE NOBOT =====================
  let nobotData = loadDB("./lib/database/nobot.json") || {};

  if (!nobotData.activeGroups) nobotData.activeGroups = {};
  if (!nobotData.bannedUsers) nobotData.bannedUsers = {};

  // List command yang TIDAK terkena nobot (bisa tetap dipakai)
  const allowedCommands = ["fish", "fishbot", "slot", "listcentang", "ceksaldo", "ceksaham", "beli", "jual", "tffish", "tfsaldo", "buatperusahaan", "buatrek", "listsaham", "saham", "ai", "gemini", "dolphin", "public","mcai","cek","listfish","afkfish","profile","ytmp4","ytmp3","ytsearch","berita","brat","iqc","ceklid","collect","village","build","fishinfo","hargafish","train","claimsaldo","gita","epsilon","menuall","menuai","menutools"];
  let pinjamanData = loadDB("./lib/database/pinjaman.json") || {};

  if (!pinjamanData.loans) pinjamanData.loans = {};
  if (!pinjamanData.mutedUsers) pinjamanData.mutedUsers = [];
  if (!pinjamanData.settings) pinjamanData.settings = {
    maxLoan: 1000000,
    interestRate: 0.1,
    loanDuration: 86400000,
    minLoan: 10000
  };
  function isMuted(userId) {
    return pinjamanData.mutedUsers.includes(userId);
  }

  function muteUser(userId) {
    if (!pinjamanData.mutedUsers.includes(userId)) {
      pinjamanData.mutedUsers.push(userId);
      saveDB("./lib/database/pinjaman.json", pinjamanData);
    }
  }

  function unmuteUser(userId) {
    try {
    pinjamanData.mutedUsers = pinjamanData.mutedUsers.filter(id => id !== userId);
    saveDB("./lib/database/pinjaman.json", pinjamanData);
    } catch (err) {}
  }


  // Variabel sementara untuk menyimpan state user (taruh di luar startBot)
  let bankState = {};

  // deteksi link
  const polaLink = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[A-Za-z0-9]+)/i

  // prefix command
  const prefix = "/"

  let cocInterval = null;
  let buildingsData = loadDB("./lib/database/buildings.json") || {};
  let troopsData = loadDB("./lib/database/troops.json") || {};
  let battles = loadDB("./lib/database/battles.json") || {};
  let attackSearch = {};
  let globalEmas = loadDB("./lib/database/emas.json") || {};
  let globalBtc = loadDB("./lib/database/btc.json") || {}
  let hargaDb = loadDB("./lib/database/harga.json") || {};

  let hargaEmas = hargaDb.emas || 2000000;
  let hargaBitcoin = hargaDb.bitcoin || 1000000000;

  // Konfigurasi fluktuasi
  const BATAS_TURUN_EMAS = 800000;
  const BATAS_TURUN_BITCOIN = 500000000;
  const HARGA_AWAL_EMAS = 1300000;
  const HARGA_AWAL_BITCOIN = 1200000000;
  const MAX_NAIK_EMAS = HARGA_AWAL_EMAS * 2;
  const MAX_NAIK_BITCOIN = HARGA_AWAL_BITCOIN * 5;

  let fluktuasiDb = loadDB("./lib/database/fluktuasi.json") || {};
  let fluktuasiInterval = null;

  let cryptoUserData = loadDB("./lib/database/cryptoUserData.json") || {};
  if (!cryptoUserData.users) cryptoUserData.users = {};

  let cryptoData = loadDB("./lib/database/crypto.json") || {};

  if (!cryptoData.assets) {
    cryptoData.assets = {
      "EMAS": {
        name: "Emas",
        icon: "🪙",
        initialPrice: 1300000,
        currentPrice: 1300000,
        minPrice: 500000,
        maxPrice: 2600000,
        volatility: 5,
        minBuy: 10000,
        tax: 0.02,
        active: true
      },
      "BTC": {
        name: "Bitcoin",
        icon: "₿",
        initialPrice: 1200000000,
        currentPrice: 1200000000,
        minPrice: 700000000,
        maxPrice: 6000000000,
        volatility: 5,
        minBuy: 100000,
        tax: 0.02,
        active: true
      },
      "ETH": {
        name: "Ethereum",
        icon: "Ξ",
        initialPrice: 35000000,
        currentPrice: 35000000,
        minPrice: 10000000,
        maxPrice: 175000000,
        volatility: 6,
        minBuy: 50000,
        tax: 0.02,
        active: true
      },
      "SOL": {
        name: "Solana",
        icon: "◎",
        initialPrice: 2500000,
        currentPrice: 2500000,
        minPrice: 500000,
        maxPrice: 12500000,
        volatility: 8,
        minBuy: 25000,
        tax: 0.02,
        active: true
      }
    };
  }

  // ===================== FUNGSI NOBOT =====================
  function isNobotActive(groupId) {
    try {
    return nobotData.activeGroups[groupId] === true;
    } catch (err) {}
  }

  function isBannedFromNobot(userId) {
    try {
    let banned = nobotData.bannedUsers[userId];
    if (!banned) return false;
    if (banned.unbanTime && banned.unbanTime > Date.now()) return true;
    if (banned.unbanTime && banned.unbanTime <= Date.now()) {
      delete nobotData.bannedUsers[userId];
      saveDB("./lib/database/nobot.json", nobotData);
      return false;
    }
    return banned.banned === true;
    } catch (err) {}
  }

  if (!cryptoData.users) cryptoData.users = {};
  if (!cryptoData.priceHistory) cryptoData.priceHistory = {};
  if (!cryptoData.fluktuasiDb) cryptoData.fluktuasiDb = {};

  async function updateHargaFluktuasi() {
    try {
      let emasLama = hargaEmas;
      let btcLama = hargaBitcoin;

      // === FLUKTUASI EMAS ===
      let arahEmas = Math.random() > 0.5 ? 1: -1;
      let persenEmas = (Math.random() * 5) + 0.1;
      let perubahanEmas = hargaEmas * (persenEmas / 100);
      let newHargaEmas = hargaEmas + (perubahanEmas * arahEmas);

      if (arahEmas === -1) {
        let minEmas = HARGA_AWAL_EMAS - BATAS_TURUN_EMAS;
        if (newHargaEmas < minEmas) newHargaEmas = minEmas;
      } else {
        if (newHargaEmas > MAX_NAIK_EMAS) newHargaEmas = MAX_NAIK_EMAS;
      }
      hargaEmas = Math.floor(newHargaEmas);

      // === FLUKTUASI BITCOIN ===
      let arahBtc = Math.random() > 0.5 ? 1: -1;
      let persenBtc = (Math.random() * 5) + 0.1;
      let perubahanBtc = hargaBitcoin * (persenBtc / 100);
      let newHargaBtc = hargaBitcoin + (perubahanBtc * arahBtc);

      if (arahBtc === -1) {
        let minBtc = HARGA_AWAL_BITCOIN - BATAS_TURUN_BITCOIN;
        if (newHargaBtc < minBtc) newHargaBtc = minBtc;
      } else {
        if (newHargaBtc > MAX_NAIK_BITCOIN) newHargaBtc = MAX_NAIK_BITCOIN;
      }
      hargaBitcoin = Math.floor(newHargaBtc);

      // === SIMPAN KE DATABASE ===
      let newHargaDb = loadDB("./lib/database/harga.json") || {};
      newHargaDb.emas = hargaEmas;
      newHargaDb.bitcoin = hargaBitcoin;
      newHargaDb.lastUpdate = Date.now();
      saveDB("./lib/database/harga.json", newHargaDb);

      // === SIMPAN HISTORY ===
      fluktuasiDb[Date.now()] = {
        time: Date.now(),
        emas: {
          lama: emasLama,
          baru: hargaEmas,
          arah: arahEmas === 1 ? "📈 NAIK": "📉 TURUN",
          persen: persenEmas
        },
        bitcoin: {
          lama: btcLama,
          baru: hargaBitcoin,
          arah: arahBtc === 1 ? "📈 NAIK": "📉 TURUN",
          persen: persenBtc
        }
      };

      let keys = Object.keys(fluktuasiDb);
      if (keys.length > 100) {
        let hapusKeys = keys.slice(0, keys.length - 100);
        for (let key of hapusKeys) delete fluktuasiDb[key];
      }
      saveDB("./lib/database/fluktuasi.json", fluktuasiDb);

    } catch (err) {
      console.log("FLUKTUASI ERROR:", err);
    }
  }

  // Helper ambil harga aset
  function getAssetPrice(asset) {
    try {
    return cryptoData.assets[asset]?.currentPrice || 0;
    } catch (err) {}
  }

  // Helper update harga aset
  function setAssetPrice(asset, price) {
    try {
    if (cryptoData.assets[asset]) {
      cryptoData.assets[asset].currentPrice = price;
    }} catch (err) {}
  }

  async function updateAllPrices() {
    try {
      for (let [symbol, asset] of Object.entries(cryptoData.assets)) {
        if (!asset.active) continue;

        let oldPrice = asset.currentPrice;
        let arah = Math.random() > 0.5 ? 1: -1;
        let persen = (Math.random() * asset.volatility) + 0.1;
        let perubahan = asset.currentPrice * (persen / 100);
        let newPrice = asset.currentPrice + (perubahan * arah);

        // ✅ PERBAIKAN: Gunakan initialPrice untuk batasan
        let minPrice = asset.initialPrice * 0.1; // 10% dari harga awal
        let maxPrice = asset.initialPrice * 10; // 1000% dari harga awal

        if (newPrice < minPrice) newPrice = minPrice;
        if (newPrice > maxPrice) newPrice = maxPrice;

        // Pastikan harga tidak pernah 0 atau negatif
        if (newPrice <= 0) newPrice = minPrice;

        asset.currentPrice = Math.floor(newPrice);

        // Simpan history
        if (!cryptoData.priceHistory[symbol]) cryptoData.priceHistory[symbol] = [];
        cryptoData.priceHistory[symbol].unshift({
          time: Date.now(),
          price: asset.currentPrice
        });
        if (cryptoData.priceHistory[symbol].length > 100) cryptoData.priceHistory[symbol].pop();
      }

      saveDB("./lib/database/crypto.json", cryptoData);

    } catch (err) {
      console.log("UPDATE PRICES ERROR:", err);
    }
  }

  function startPriceUpdater() {
    setInterval(() => {
      updateAllPrices();
    }, 60000);
    console.log("✅ Update harga semua aset dimulai (tiap 60 detik)");
  }

  // ===================== SAHAM (50+ PERUSAHAAN) =====================
  let globalSaham = loadDB("./lib/database/globalSaham.json") || {};
  let sahamFluktuasi = loadDB("./lib/database/sahamFluktuasi.json") || {};

  if (!globalSaham.stocks) globalSaham.stocks = {};
  if (!globalSaham.users) globalSaham.users = {};
  if (!globalSaham.indeks) globalSaham.indeks = {
    lastUpdate: null,
    history: []
  };
  if (!globalSaham.companyStocks) globalSaham.companyStocks = {};

  // Inisialisasi jika kosong
  if (!globalSaham.stocks || Object.keys(globalSaham.stocks).length === 0) {
    globalSaham = {
      stocks: {
        "BBCA": {
          "name": "Bank Central Asia",
          "sector": "Perbankan",
          "initialPrice": 8500,
          "currentPrice": 8500,
          "volume": 1000000,
          "icon": "🏦",
          "description": "Bank swasta terbesar di Indonesia"
        },
        "BBRI": {
          "name": "Bank Rakyat Indonesia",
          "sector": "Perbankan",
          "initialPrice": 4200,
          "currentPrice": 4200,
          "volume": 2000000,
          "icon": "🏧",
          "description": "Bank mikro terbesar"
        },
        "BMRI": {
          "name": "Bank Mandiri",
          "sector": "Perbankan",
          "initialPrice": 6200,
          "currentPrice": 6200,
          "volume": 1500000,
          "icon": "🏛️",
          "description": "Bank BUMN terbesar"
        },
        "BBNI": {
          "name": "Bank Negara Indonesia",
          "sector": "Perbankan",
          "initialPrice": 4800,
          "currentPrice": 4800,
          "volume": 1200000,
          "icon": "🏢",
          "description": "Bank BUMN tertua"
        },
        "BRIS": {
          "name": "Bank BRISyariah",
          "sector": "Perbankan",
          "initialPrice": 1800,
          "currentPrice": 1800,
          "volume": 800000,
          "icon": "🕌",
          "description": "Bank syariah terbesar"
        },
        "TLKM": {
          "name": "Telkom Indonesia",
          "sector": "Telekomunikasi",
          "initialPrice": 3500,
          "currentPrice": 3500,
          "volume": 1500000,
          "icon": "📡",
          "description": "BUMN telekomunikasi"
        },
        "ISAT": {
          "name": "Indosat Ooredoo",
          "sector": "Telekomunikasi",
          "initialPrice": 2200,
          "currentPrice": 2200,
          "volume": 900000,
          "icon": "📱",
          "description": "Provider seluler"
        },
        "EXCL": {
          "name": "XL Axiata",
          "sector": "Telekomunikasi",
          "initialPrice": 2050,
          "currentPrice": 2050,
          "volume": 600000,
          "icon": "📱",
          "description": "Provider XL"
        },
        "FREN": {
          "name": "Smartfren Telecom",
          "sector": "Telekomunikasi",
          "initialPrice": 50,
          "currentPrice": 50,
          "volume": 10000000,
          "icon": "📶",
          "description": "Smartfren"
        },
        "TOWR": {
          "name": "Sarana Menara Nusantara",
          "sector": "Telekomunikasi",
          "initialPrice": 850,
          "currentPrice": 850,
          "volume": 2000000,
          "icon": "📡",
          "description": "Penyedia menara telekomunikasi"
        },
        "MTEL": {
          "name": "Dayamitra Telekomunikasi",
          "sector": "Telekomunikasi",
          "initialPrice": 600,
          "currentPrice": 600,
          "volume": 1500000,
          "icon": "📶",
          "description": "Mitratel"
        },
        "ASII": {
          "name": "Astra International",
          "sector": "Otomotif",
          "initialPrice": 5200,
          "currentPrice": 5200,
          "volume": 800000,
          "icon": "🚗",
          "description": "Konglomerat otomotif"
        },
        "AUTO": {
          "name": "Astra Otoparts",
          "sector": "Otomotif",
          "initialPrice": 1800,
          "currentPrice": 1800,
          "volume": 500000,
          "icon": "🔧",
          "description": "Komponen otomotif"
        },
        "GDYR": {
          "name": "Goodyear Indonesia",
          "sector": "Otomotif",
          "initialPrice": 1600,
          "currentPrice": 1600,
          "volume": 300000,
          "icon": "🛞",
          "description": "Produsen ban"
        },
        "UNVR": {
          "name": "Unilever Indonesia",
          "sector": "Consumer Goods",
          "initialPrice": 3800,
          "currentPrice": 3800,
          "volume": 600000,
          "icon": "🧴",
          "description": "Produk rumah tangga"
        },
        "ICBP": {
          "name": "Indofood CBP",
          "sector": "Consumer Goods",
          "initialPrice": 9800,
          "currentPrice": 9800,
          "volume": 400000,
          "icon": "🍜",
          "description": "Indomie"
        },
        "INDF": {
          "name": "Indofood Sukses Makmur",
          "sector": "Consumer Goods",
          "initialPrice": 6200,
          "currentPrice": 6200,
          "volume": 500000,
          "icon": "🍚",
          "description": "Induk Indofood"
        },
        "MYOR": {
          "name": "Mayora Indah",
          "sector": "Consumer Goods",
          "initialPrice": 2200,
          "currentPrice": 2200,
          "volume": 700000,
          "icon": "🍪",
          "description": "Kopiko, Roma"
        },
        "HMSP": {
          "name": "HM Sampoerna",
          "sector": "Consumer Goods",
          "initialPrice": 850,
          "currentPrice": 850,
          "volume": 1000000,
          "icon": "🚬",
          "description": "Rokok Sampoerna"
        },
        "GGRM": {
          "name": "Gudang Garam",
          "sector": "Consumer Goods",
          "initialPrice": 18000,
          "currentPrice": 18000,
          "volume": 200000,
          "icon": "🚬",
          "description": "Rokok Gudang Garam"
        },
        "KLBF": {
          "name": "Kalbe Farma",
          "sector": "Consumer Goods",
          "initialPrice": 1500,
          "currentPrice": 1500,
          "volume": 1200000,
          "icon": "💊",
          "description": "Farmasi terbesar"
        },
        "ADRO": {
          "name": "Adaro Energy",
          "sector": "Energi",
          "initialPrice": 1800,
          "currentPrice": 1800,
          "volume": 3000000,
          "icon": "⚡",
          "description": "Tambang batu bara"
        },
        "BUMI": {
          "name": "Bumi Resources",
          "sector": "Energi",
          "initialPrice": 120,
          "currentPrice": 120,
          "volume": 10000000,
          "icon": "⛏️",
          "description": "Tambang batu bara"
        },
        "PTBA": {
          "name": "Bukit Asam",
          "sector": "Energi",
          "initialPrice": 2600,
          "currentPrice": 2600,
          "volume": 800000,
          "icon": "⛏️",
          "description": "BUMN tambang batu bara"
        },
        "MEDC": {
          "name": "Medco Energi",
          "sector": "Energi",
          "initialPrice": 950,
          "currentPrice": 950,
          "volume": 600000,
          "icon": "🛢️",
          "description": "Minyak & gas"
        },
        "PGAS": {
          "name": "Perusahaan Gas Negara",
          "sector": "Energi",
          "initialPrice": 1250,
          "currentPrice": 1250,
          "volume": 700000,
          "icon": "🔥",
          "description": "Distribusi gas"
        },
        "GOTO": {
          "name": "GoTo Gojek Tokopedia",
          "sector": "Teknologi",
          "initialPrice": 280,
          "currentPrice": 280,
          "volume": 50000000,
          "icon": "🦫",
          "description": "Decacorn Indonesia"
        },
        "BELI": {
          "name": "Global Digital Niaga",
          "sector": "Teknologi",
          "initialPrice": 200,
          "currentPrice": 200,
          "volume": 20000000,
          "icon": "🛒",
          "description": "Blibli"
        },
        "DIVA": {
          "name": "Diva Teknologi",
          "sector": "Teknologi",
          "initialPrice": 150,
          "currentPrice": 150,
          "volume": 15000000,
          "icon": "💻",
          "description": "Software house"
        },
        "WIFI": {
          "name": "Solusi Sinergi Digital",
          "sector": "Teknologi",
          "initialPrice": 2800,
          "currentPrice": 2800,
          "volume": 400000,
          "icon": "🌐",
          "description": "Internet provider"
        },
        "DCII": {
          "name": "DCI Indonesia",
          "sector": "Teknologi",
          "initialPrice": 120000,
          "currentPrice": 120000,
          "volume": 50000,
          "icon": "💾",
          "description": "Data center"
        },
        "JSMR": {
          "name": "Jasa Marga",
          "sector": "Infrastruktur",
          "initialPrice": 3800,
          "currentPrice": 3800,
          "volume": 500000,
          "icon": "🛣️",
          "description": "Tol trans Jawa"
        },
        "WIKA": {
          "name": "Wijaya Karya",
          "sector": "Konstruksi",
          "initialPrice": 250,
          "currentPrice": 250,
          "volume": 2000000,
          "icon": "🏗️",
          "description": "BUMN konstruksi"
        },
        "PTPP": {
          "name": "PP Properti",
          "sector": "Properti",
          "initialPrice": 120,
          "currentPrice": 120,
          "volume": 3000000,
          "icon": "🏘️",
          "description": "Pengembang properti"
        },
        "BSDE": {
          "name": "Bumi Serpong Damai",
          "sector": "Properti",
          "initialPrice": 1050,
          "currentPrice": 1050,
          "volume": 800000,
          "icon": "🏙️",
          "description": "BSD City"
        },
        "CTRA": {
          "name": "Ciputra Development",
          "sector": "Properti",
          "initialPrice": 980,
          "currentPrice": 980,
          "volume": 700000,
          "icon": "🏢",
          "description": "Ciputra Group"
        },
        "SMRA": {
          "name": "Summarecon Agung",
          "sector": "Properti",
          "initialPrice": 550,
          "currentPrice": 550,
          "volume": 700000,
          "icon": "🏬",
          "description": "Summarecon"
        },
        "CPIN": {
          "name": "Charoen Pokphand",
          "sector": "Agrikultur",
          "initialPrice": 4800,
          "currentPrice": 4800,
          "volume": 600000,
          "icon": "🐔",
          "description": "Pakan ternak"
        },
        "JPFA": {
          "name": "Japfa Comfeed",
          "sector": "Agrikultur",
          "initialPrice": 1650,
          "currentPrice": 1650,
          "volume": 500000,
          "icon": "🐄",
          "description": "Peternakan"
        },
        "AALI": {
          "name": "Astra Agro Lestari",
          "sector": "Perkebunan",
          "initialPrice": 9500,
          "currentPrice": 9500,
          "volume": 300000,
          "icon": "🌴",
          "description": "Sawit Astra"
        },
        "LSIP": {
          "name": "PP London Sumatra",
          "sector": "Perkebunan",
          "initialPrice": 1200,
          "currentPrice": 1200,
          "volume": 400000,
          "icon": "🌿",
          "description": "Perkebunan"
        },
        "ANTM": {
          "name": "Aneka Tambang",
          "sector": "Pertambangan",
          "initialPrice": 1450,
          "currentPrice": 1450,
          "volume": 900000,
          "icon": "⛏️",
          "description": "Tambang emas & nikel"
        },
        "INCO": {
          "name": "Vale Indonesia",
          "sector": "Pertambangan",
          "initialPrice": 4200,
          "currentPrice": 4200,
          "volume": 400000,
          "icon": "⚙️",
          "description": "Tambang nikel"
        },
        "TINS": {
          "name": "Timah",
          "sector": "Pertambangan",
          "initialPrice": 850,
          "currentPrice": 850,
          "volume": 500000,
          "icon": "🪙",
          "description": "Tambang timah"
        },
        "SIDO": {
          "name": "Sido Muncul",
          "sector": "Farmasi",
          "initialPrice": 680,
          "currentPrice": 680,
          "volume": 800000,
          "icon": "🍯",
          "description": "Jamu & herbal"
        },
        "KAEF": {
          "name": "Kimia Farma",
          "sector": "Farmasi",
          "initialPrice": 850,
          "currentPrice": 850,
          "volume": 600000,
          "icon": "💊",
          "description": "BUMN farmasi"
        },
        "ACES": {
          "name": "Ace Hardware",
          "sector": "Ritel",
          "initialPrice": 850,
          "currentPrice": 850,
          "volume": 500000,
          "icon": "🔨",
          "description": "Perlengkapan rumah"
        },
        "ERAA": {
          "name": "Erajaya Swasembada",
          "sector": "Ritel",
          "initialPrice": 450,
          "currentPrice": 450,
          "volume": 1000000,
          "icon": "📱",
          "description": "Distributor HP"
        },
        "MAPI": {
          "name": "Mitra Adiperkasa",
          "sector": "Ritel",
          "initialPrice": 1650,
          "currentPrice": 1650,
          "volume": 600000,
          "icon": "👕",
          "description": "Fashion retail"
        },
        "SMGR": {
          "name": "Semen Indonesia",
          "sector": "Semen",
          "initialPrice": 8500,
          "currentPrice": 8500,
          "volume": 400000,
          "icon": "🏭",
          "description": "BUMN semen"
        },
        "SMCB": {
          "name": "Semen Baturaja",
          "sector": "Semen",
          "initialPrice": 350,
          "currentPrice": 350,
          "volume": 500000,
          "icon": "🏗️",
          "description": "Semen Baturaja"
        },
        "INKP": {
          "name": "Indah Kiat Pulp & Paper",
          "sector": "Pulp & Kertas",
          "initialPrice": 7800,
          "currentPrice": 7800,
          "volume": 300000,
          "icon": "📄",
          "description": "Produsen kertas"
        },
        "TKIM": {
          "name": "Pabrik Kertas Tjiwi Kimia",
          "sector": "Pulp & Kertas",
          "initialPrice": 6500,
          "currentPrice": 6500,
          "volume": 300000,
          "icon": "📃",
          "description": "Kertas"
        },
        "PRAY": {
          "name": "Pelayaran Nasional",
          "sector": "Transportasi",
          "initialPrice": 280,
          "currentPrice": 280,
          "volume": 800000,
          "icon": "🚢",
          "description": "Pelni"
        }
      },
      users: {},
      indeks: {
        lastUpdate: null,
        history: []
      }
    };
    saveDB("./lib/database/globalSaham.json", globalSaham);
  }
  // Inisialisasi jika kosong
  let jumlahBtc = loadDB("./lib/database/globalBtc.json") || {};

  if (!jumlahBtc.totalStock) jumlahBtc.totalStock = 500;
  if (!jumlahBtc.miningActive) jumlahBtc.miningActive = false;
  if (!jumlahBtc.totalMined) jumlahBtc.totalMined = 0;

  let miningStokInterval = null;
  // Fungsi start interval (cegah double)
  function startFluktuasiInterval() {
    if (fluktuasiInterval) {
      fluktuasiInterval = null;
      clearInterval(fluktuasiInterval);
    }
    fluktuasiInterval = setInterval(() => {
      updateHargaFluktuasi();
    }, 60000);
    console.log("✅ Fluktuasi harga emas & btc dimulai");
    startSahamFluktuasi();
    startPriceUpdater();
  }

  let socialData = loadDB("./lib/database/social.json") || {};

  if (!socialData.users) socialData.users = {};
  if (!socialData.friendRequests) socialData.friendRequests = {};
  if (!socialData.blocked) socialData.blocked = {};

  let verifiedData = loadDB("./lib/database/verified.json") || {};

  if (!verifiedData.verifiedUsers) verifiedData.verifiedUsers = [];
  if (!verifiedData.requests) verifiedData.requests = [];
  if (!verifiedData.settings) verifiedData.settings = {
    badgeIcon: "☑︎",
    badgeName: "Verified"
  };

  // ===================== FUNGSI SOSIAL =====================

  // Update statistik follower/following user
  async function updateUserStats(username) {
    try {
    if (!socialData.users[username]) {
      socialData.users[username] = {
        followers: [],
        following: [],
        friends: [],
        bio: "",
        joinDate: Date.now(),
        lastActive: Date.now(),
        posts: 0
      };
    }

    // Hitung ulang friends (mutual follow)
    let friends = [];
    for (let following of socialData.users[username].following) {
      if (socialData.users[following] && socialData.users[following].followers.includes(username)) {
        friends.push(following);
      }
    }
    socialData.users[username].friends = friends;

    saveDB("./lib/database/social.json", socialData);
    return socialData.users[username];
    } catch (err) {}
  }

  // Cek apakah user terdaftar di sosial
  function isSocialUserExists(username) {
    try {
    return socialData.users[username] !== undefined;
    } catch (err) {}
  }

  // Cek apakah sudah follow
  function isFollowing(from, to) {
    try {
    if (!socialData.users[from]) return false;
    return socialData.users[from].following.includes(to);
    } catch (err) {}
  }

  // Cek apakah sudah teman
  function isFriend(user1, user2) {
    try {
    if (!socialData.users[user1] || !socialData.users[user2]) return false;
    return socialData.users[user1].friends.includes(user2);
    } catch (err) {}
  }

  // Kirim notifikasi sosial
  async function sendSocialNotification(targetJid, text) {
    try {
    if (targetJid) {
      await socket.sendMessage(targetJid, {
        text: text
      }).catch(() => {});
    }} catch (err) {}
  }

  // Cek pinjaman overdue setiap jam
  setInterval(() => {
    try {
      let now = Date.now();

      for (let [username, loan] of Object.entries(pinjamanData.loans)) {
        if (loan.status === "ACTIVE" && now > loan.dueDate) {
          let userId = getUserIdByUsername(username);
          if (userId && !isMuted(userId)) {
            muteUser(userId);
            console.log(`🔇 User @${username} di-MUTE karena telat bayar pinjaman`);

            // Kirim notifikasi
            socket.sendMessage(userId, {
              text: `*🔇 AKUN ANDA TELAH DI BEKUKAN!*\n\n*⚠️ Karena tidak melunasi pinjaman tepat waktu, akun Anda telah dibekukan.*\n*💰 Sisa tagihan : Rp${loan.totalPay.toLocaleString()}*\n*📌 Hubungi owner untuk informasi lebih lanjut.*`
            }).catch(() => {});
          }
        }
      }} catch (err) {
      console.log("Error : ", err)
    }
  }, 3600000); // Setiap 1 jam

  // ===================== FUNGSI VERIFIED BADGE =====================

  // Cek apakah user sudah terverifikasi
  function isVerified(username) {
    try {
    return verifiedData.verifiedUsers.includes(username);
    } catch (err) {}
  }

  // Dapatkan badge text
  function getBadgeText(username) {
    try {
    if (isVerified(username)) {
      return `${verifiedData.settings.badgeIcon} `;
    }
    return "";
    } catch (err) {}
  }

  // Update display name dengan badge (untuk ditampilkan)
  function getDisplayNameWithBadge(userId) {
    try {
    let user = users[userId];
    if (!user) return userId.split("@")[0];

    let badge = isVerified(user.username) ? `${verifiedData.settings.badgeIcon} `: "";
    return `${badge}${user.displayName || user.username}`;
    } catch (err) {}
  }

  if (!globalSaham.users) globalSaham.users = {};
  if (!globalSaham.indeks) globalSaham.indeks = {
    lastUpdate: null,
    history: []
  };

  // Fungsi update harga saham (fluktuasi)
  async function updateHargaSaham() {
    try {
      let indeksKomposit = 0;
      let perubahanHariIni = [];

      for (let [kode, stock] of Object.entries(globalSaham.stocks)) {
        let oldPrice = stock.currentPrice;

        // Fluktuasi random berdasarkan sektor
        let volatility = stock.type === "company" ? 3: 1; // Perusahaan lebih volatil
        if (stock.sector === "Teknologi") volatility = 2.5;
        else if (stock.sector === "Energi") volatility = 2;
        else if (stock.sector === "Perbankan") volatility = 1;
        else if (stock.sector === "Consumer Goods") volatility = 0.8;
        else volatility = 1.2;

        let perubahanPersen = (Math.random() * 10 * volatility) - 5; // -5% sampai +5% (dikalikan volatilitas)
        let perubahan = stock.currentPrice * (perubahanPersen / 100);
        let newPrice = Math.floor(stock.currentPrice + perubahan);

        // Batasan harga (tidak bisa kurang dari 10% harga awal)
        let minPrice = Math.floor(stock.initialPrice * 0.1);
        let maxPrice = stock.initialPrice * 9999999999;

        if (newPrice < minPrice) newPrice = minPrice;
        if (newPrice > maxPrice) newPrice = maxPrice;

        stock.currentPrice = newPrice;
        stock.lastUpdate = Date.now();
        stock.volume += Math.floor(Math.random() * 5000);

        indeksKomposit += newPrice;

        if (stock.type === "company" && stock.companyRef) {
          let company = globalSaham.companyStocks[stock.companyRef];
          if (company) {
            company.currentPrice = newPrice;
          }
        }

        if (oldPrice !== newPrice) {
          perubahanHariIni.push({
            kode: kode,
            nama: stock.name,
            lama: oldPrice,
            baru: newPrice,
            persen: perubahanPersen.toFixed(2)
          });
        }
      }

      // Update indeks komposit
      let indeksRata = indeksKomposit / Object.keys(globalSaham.stocks).length;
      globalSaham.indeks.lastUpdate = Date.now();

      if (!globalSaham.indeks.history) globalSaham.indeks.history = [];
      globalSaham.indeks.history.unshift({
        time: Date.now(),
        value: Math.floor(indeksRata),
        changes: perubahanHariIni.slice(0, 10)
      });

      if (globalSaham.indeks.history.length > 50) {
        globalSaham.indeks.history.pop();
      }

      // Simpan history fluktuasi
      if (perubahanHariIni.length > 0) {
        if (!sahamFluktuasi[Date.now()]) {
          sahamFluktuasi[Date.now()] = [];
        }
        sahamFluktuasi[Date.now()] = perubahanHariIni.slice(0, 20);

        let keys = Object.keys(sahamFluktuasi).sort((a, b) => b - a);
        if (keys.length > 100) {
          for (let i = 100; i < keys.length; i++) {
            delete sahamFluktuasi[keys[i]];
          }
        }
        saveDB("./lib/database/sahamFluktuasi.json", sahamFluktuasi);
      }

      saveDB("./lib/database/globalSaham.json", globalSaham);

    } catch (err) {
      console.log("SAHAM FLUKTUASI ERROR:", err);
    }
  }

  // Mulai interval fluktuasi saham
  function startSahamFluktuasi() {
    setInterval(() => {
      updateHargaSaham();
    }, 90000); // Update setiap 90 detik
    console.log("✅ Fluktuasi saham dimulai (update tiap 90 detik) - 50+ perusahaan");
  }

  // ===================== SISTEM LOGIN GLOBAL (HELPER FUNCTIONS) =====================

  // Helper functions untuk mendapatkan data user
  function getUsername(userId) {
    try {
    return users[userId]?.username || userId.split("@")[0];
    } catch (err) {}
  }
  function getDisplayName(userId) {
    try {
    let user = users[userId];
    if (!user) return userId.split("@")[0];

    let badge = isVerified(user.username) ? `${verifiedData.settings.badgeIcon} `: "";
    return `${badge}${user.displayName || user.username}`;
    } catch (err) {}
  }

  function getUserIdByUsername(username) {
    try {
    for (let [userId, data] of Object.entries(users)) {
      if (data.username === username.toLowerCase()) return userId;
    }
    return null;
    } catch (err) {}
  }

  function isUserExists(username) {
    try {
    return Object.values(users).some(u => u.username === username.toLowerCase());
    } catch (err) {}
  }

  function getCurrentUserId(username) {
    try {
    return getUserIdByUsername(username);
    } catch (err) {}
  }

  // Get user data by username
  function getUserData(username) {
    try {
    let userId = getUserIdByUsername(username);
    if (!userId) return null;
    return {
      userId: userId,
      username: username,
      displayName: users[userId]?.displayName,
      saldo: globalSaldo[username] || 0,
      fish: globalFishInventory[username] || null,
      village: globalVillages[username] || null
    };
    } catch (err) {}
  }
  function startMiningStok() {
    try {
    if (miningStokInterval) clearInterval(miningStokInterval);

    miningStokInterval = setInterval(() => {
      if (!jumlahBtc.miningActive) return;

      jumlahBtc.totalStock += 0.1;
      jumlahBtc.totalMined += 0.1;

      if (Math.floor(Date.now() / 1000) % 10 === 0) {
        saveDB("./lib/database/globalBtc.json", jumlahBtc);
      }
    },
      1000);
    } catch (err) {}
  }

  function stopMiningStok() {
    if (miningStokInterval) {
      clearInterval(miningStokInterval);
      miningStokInterval = null;
    }
  }
  // Bunga bank setiap 24 jam
  setInterval(() => {
    try {
    for (let [kode, company] of Object.entries(globalSaham.companyStocks)) {
      if (company.sector === "bank" && company.companyData?.bankData) {
        let bankData = company.companyData.bankData;
        let interestRate = bankData.interestRate / 100;

        for (let [customer, deposit] of Object.entries(bankData.customerDeposits || {})) {
          let bunga = Math.floor(deposit * interestRate);
          if (bunga > 0) {
            bankData.customerDeposits[customer] += bunga;
            bankData.totalDeposit += bunga;
            company.companyData.cash -= bunga; // Bank bayar bunga dari kas

            // Kirim notifikasi ke user
            let userId = getUserIdByUsername(customer);
            if (userId) {
              socket.sendMessage(userId, {
                text: `*📈 BUNGA BANK MASUK!* 📈\n\n*🏦 Bank : ${company.name} (${kode})*\n*💰 Bunga : +Rp${bunga.toLocaleString()}*\n*💳 Total deposit : Rp${bankData.customerDeposits[customer].toLocaleString()}*\n*📌 /bankinfo ${kode} - Cek detail bank*`
              }).catch(() => {});
            }
          }
        }
      }
    }
    saveDB("./lib/database/globalSaham.json", globalSaham);
    } catch (err) {}
  }, 24 * 60 * 60 * 1000);
  const problems = {
    makanan: [{
      name: "🍚 Stok Bahan Habis", effect: 0.7, duration: 2, cost: 500000, desc: "Bahan baku habis, produksi berhenti!", solve: "Beli bahan baku baru"
    },
      {
        name: "🥩 Kadaluarsa Massal", effect: 0.5, duration: 3, cost: 750000, desc: "Banyak produk kadaluarsa!", solve: "Buang dan ganti produk baru"
      },
      {
        name: "🐀 Hama di Gudang", effect: 0.6, duration: 4, cost: 400000, desc: "Hama merusak stok bahan!", solve: "Fumigasi gudang"
      },
      {
        name: "📉 Selera Pasar Berubah", effect: 0.8, duration: 6, cost: 600000, desc: "Produk kurang diminati!", solve: "Inovasi resep baru"
      },
      {
        name: "🚚 Distribusi Gagal", effect: 0.5, duration: 2, cost: 350000, desc: "Pengiriman produk terhambat!", solve: "Cari distributor baru"
      },
      {
        name: "🌡️ Suhu Penyimpanan Rusak", effect: 0.4, duration: 3, cost: 450000, desc: "Produk cepat rusak!", solve: "Service kulkas"
      },
      {
        name: "💸 Harga Bahan Naik", effect: 0.85, duration: 8, cost: 800000, desc: "Modal produksi naik drastis!", solve: "Cari supplier alternatif"
      }],
    barang: [{
      name: "🏭 Mesin Rusak", effect: 0.5, duration: 4, cost: 1000000, desc: "Mesin produksi mogok!", solve: "Service mesin"
    },
      {
        name: "⚡ Listrik Padam", effect: 0.3, duration: 2, cost: 200000, desc: "Produksi terhenti!", solve: "Pakai genset"
      },
      {
        name: "📦 Kualitas Produk Turun", effect: 0.7, duration: 5, cost: 600000, desc: "Banyak produk cacat!", solve: "Improvisasi kualitas"
      },
      {
        name: "🚫 Bahan Baku Langka", effect: 0.6, duration: 6, cost: 900000, desc: "Bahan baku sulit didapat!", solve: "Cari sumber baru"
      },
      {
        name: "📜 Regulasi Baru", effect: 0.75, duration: 7, cost: 500000, desc: "Ada aturan pemerintah baru!", solve: "Urus perizinan"
      },
      {
        name: "🔧 Peralatan Usang", effect: 0.65, duration: 4, cost: 700000, desc: "Mesin sudah tua!", solve: "Upgrade peralatan"
      },
      {
        name: "💼 Karyawan Mogok", effect: 0.4, duration: 3, cost: 400000, desc: "Karyawan demo minta gaji naik!", solve: "Naikkan gaji"
      }],
    bank: [{
      name: "💸 Kredit Macet", effect: 0.7, duration: 5, cost: 1200000, desc: "Banyak nasabah gagal bayar!", solve: "Restrukturisasi kredit"
    },
      {
        name: "🏃 Nasabah Kabur", effect: 0.6, duration: 3, cost: 800000, desc: "Nasabar tarik deposit besar!", solve: "Promo bunga"
      },
      {
        name: "🖥️ Sistem Error", effect: 0.5, duration: 2, cost: 300000, desc: "Server bank error!", solve: "Service IT"
      },
      {
        name: "📉 Inflasi Tinggi", effect: 0.8, duration: 6, cost: 1000000, desc: "Nilai uang turun!", solve: "Tingkatkan suku bunga"
      },
      {
        name: "💳 Data Bocor", effect: 0.4, duration: 4, cost: 500000, desc: "Kebocoran data nasabah!", solve: "Perkuat keamanan"
      },
      {
        name: "🔒 Otoritas Bank", effect: 0.65, duration: 7, cost: 700000, desc: "Bank kena sanksi regulator!", solve: "Penalti dan perbaikan"
      },
      {
        name: "⚖️ Gugatan Hukum", effect: 0.55, duration: 5, cost: 900000, desc: "Ada gugatan ke bank!", solve: "Bayar ganti rugi"
      }],
    common: [{
      name: "📊 Pasar Lesu", effect: 0.85, duration: 6, cost: 500000, desc: "Permintaan pasar turun!", solve: "Promosi besar-besaran"
    },
      {
        name: "🏪 Saingan Buka", effect: 0.7, duration: 8, cost: 600000, desc: "Ada kompetitor baru!", solve: "Inovasi produk"
      },
      {
        name: "💰 Uang Maling", effect: 0.5, duration: 2, cost: 300000, desc: "Kehilangan uang kas!", solve: "Tambah keamanan"
      },
      {
        name: "📜 Pajak Naik", effect: 0.8, duration: 10, cost: 800000, desc: "Pemerintah naikkan pajak!", solve: "Bayar pajak tambahan"
      }]
  };
  function generateProblem(companyType) {
    try {
    let pool = [...problems.common];

    if (companyType === "makanan") pool.push(...problems.makanan);
    else if (companyType === "barang") pool.push(...problems.barang);
    else if (companyType === "bank") pool.push(...problems.bank);

    let randomProblem = pool[Math.floor(Math.random() * pool.length)];

    // Random durasi 2-6 jam (dalam milidetik)
    let durationMs = (randomProblem.duration + Math.random() * 4) * 60 * 60 * 1000;

    return {
      ...randomProblem,
      durationMs: durationMs,
      effectMultiplier: randomProblem.effect
    };
    } catch (err) {}
  }
  async function checkAndProcessProblems() {
    try {
    for (let [kode, company] of Object.entries(globalSaham.companyStocks)) {
      if (!company.companyData) continue;

      // Cek problem aktif
      if (company.companyData.problem && company.companyData.problem.until > Date.now()) {
        // Problem masih aktif, efek masih berlaku
        continue;
      }

      // Jika problem sudah lewat waktu
      if (company.companyData.problem && company.companyData.problem.until <= Date.now()) {
        // Problem selesai, harga kembali normal
        let stock = globalSaham.stocks[kode];
        if (stock) {
          stock.currentPrice = Math.floor(stock.currentPrice / company.companyData.problem.effect);
        }
        company.companyData.problem = null;
        continue;
      }

      // Random chance 5% per jam untuk kena problem
      if (Math.random() < 0.05 && !company.companyData.problem) {
        let problem = generateProblem(company.sector);
        let stock = globalSaham.stocks[kode];

        // Simpan problem
        company.companyData.problem = {
          name: problem.name,
          desc: problem.desc,
          effect: problem.effectMultiplier,
          cost: problem.cost,
          until: Date.now() + problem.durationMs,
          solved: false
        };

        // Efek ke harga saham (turun)
        if (stock) {
          let oldPrice = stock.currentPrice;
          stock.currentPrice = Math.floor(stock.currentPrice * problem.effectMultiplier);

          // Catat history
          company.companyData.history = company.companyData.history || [];
          company.companyData.history.unshift({
            time: Date.now(),
            type: "PROBLEM",
            name: problem.name,
            oldPrice: oldPrice,
            newPrice: stock.currentPrice
          });
        }

        // Kirim notifikasi ke owner
        let ownerId = getUserIdByUsername(company.owner);
        if (ownerId) {
          await socket.sendMessage(ownerId, {
            text: `*⚠️ PERINGATAN!* ⚠️\n\n*🏢 Perusahaan : ${company.name} (${kode})*\n*🔴 ${problem.name}*\n*📝 ${problem.desc}*\n*📉 Harga saham turun ${Math.round((1 - problem.effectMultiplier) * 100)}%*\n*💰 Biaya solusi : Rp${problem.cost.toLocaleString()}*\n\n*📌 /selesaikanproblem ${kode} - Selesaikan masalah*`
          }).catch(() => {});
        }
      }
    }

    saveDB("./lib/database/globalSaham.json", globalSaham);
    } catch (err) {}
  }
  // Jalankan setiap 1 jam
  setInterval(() => {
    checkAndProcessProblems();
  }, 60 * 60 * 1000);


  // ===================== START BOT =====================
  async function startBot() {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState("session")
    const {
      version
    } = await fetchLatestBaileysVersion()

    const socket = makeSocket( {
      version,
      logger: pino( {
        level: "silent"
      }),
      auth: state,
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
      // ← TAMBAHKAN INI
      keepAliveIntervalMs: 15000,
      // ← TAMBAHKAN INI
      retryRequestDelayMs: 5000,
      // ← TAMBAHKAN INI
      defaultQueryTimeoutMs: 60000,
      // ← TAMBAHKAN INI
      markOnlineOnConnect: true,
      // ← TAMBAHKAN INI
      syncFullHistory: false // ← TAMBAHKAN INI
    })

    // ===================== PAIRING CODE =====================
    if (!socket.authState.creds.registered) {

      setTimeout(async () => {
        try {
          const code = await socket.requestPairingCode(nomorBot)
          console.log("PAIRING:", code)
        } catch (err) {
          console.log("Pairing error:", err)
        }
      }, 5000)

    }

    socket.ev.on("creds.update", saveCreds)

    // EVENT connection.update - PERBAIKAN: hanya saat open
    socket.ev.on("connection.update", async (update) => {
      const {
        connection
      } = update;
      if (connection === "open") {
        console.log("✅ Bot terhubung!");
        startFluktuasiInterval();

        if (jumlahBtc.miningActive) {
          startMiningStok();
          console.log("⛏️ Mining stok BTC dimulai");
        }
      }
      if (connection === "close") {
        console.log("Koneksi terputus, reconnect...")
        startBot();
      }
    });

    // Konverter dari sistem lama ke sistem baru (MIGRASI LENGKAP)
    async function migrateUserData(userId) {
      try {
      let username = getUsername(userId);
      let migrated = false;

      // 1. MIGRASI SALDO
      let oldSaldo = loadDB("./lib/database/saldo.json") || {};
      if (oldSaldo[userId] && !globalSaldo[username]) {
        globalSaldo[username] = oldSaldo[userId];
        migrated = true;
        console.log(`✅ Migrasi saldo: ${username} = Rp${oldSaldo[userId].toLocaleString()}`);
      }

      // 2. MIGRASI FISH INVENTORY
      let oldFish = loadDB("./lib/database/fishInventory.json") || {};
      if (oldFish[userId] && !globalFishInventory[username]) {
        globalFishInventory[username] = oldFish[userId];
        migrated = true;
        console.log(`✅ Migrasi fish inventory: ${username} (${oldFish[userId].totalFish} ikan)`);
      }

      // 3. MIGRASI VILLAGE (Clash of Clans)
      let oldVillage = loadDB("./lib/database/villages.json") || {};
      if (oldVillage[userId] && !globalVillages[username]) {
        globalVillages[username] = oldVillage[userId];
        // Update nama desa pakai display name
        if (users[userId]?.displayName) {
          globalVillages[username].name = `Desa ${users[userId].displayName}`;
        }
        migrated = true;
        console.log(`✅ Migrasi village: ${username} (TH ${oldVillage[userId].townHall})`);
      }

      // 4. MIGRASI MARKETPLACE (Produk yang dijual oleh user ini)
      let oldMarketplace = loadDB("./lib/database/marketplace.json") || {};
      let marketplaceMigrated = false;

      for (let [productId, product] of Object.entries(oldMarketplace)) {
        if (product.seller === userId) {
          // Konversi seller ke username
          globalMarketplace[productId] = {
            ...product,
            seller: username,
            sellerName: username,
            sellerDisplay: users[userId]?.displayName || username
          };
          marketplaceMigrated = true;
        }
      }
      if (marketplaceMigrated) {
        migrated = true;
        console.log(`✅ Migrasi marketplace: Produk milik ${username}`);
      }

      // 5. MIGRASI CLAIM COOLDOWN (Opsional)
      let oldClaimCooldown = loadDB("./lib/database/claimCooldown.json") || {};
      let globalClaimCooldown = loadDB("./lib/database/globalClaimCooldown.json") || {};
      if (oldClaimCooldown[userId] && !globalClaimCooldown[username]) {
        globalClaimCooldown[username] = oldClaimCooldown[userId];
        saveDB("./lib/database/globalClaimCooldown.json", globalClaimCooldown);
        migrated = true;
      }

      // 6. MIGRASI BATTLES (Riwayat pertempuran)
      let oldBattles = loadDB("./lib/database/battles.json") || {};
      let globalBattles = loadDB("./lib/database/globalBattles.json") || {};
      let battlesMigrated = false;

      for (let [battleId, battle] of Object.entries(oldBattles)) {
        if (battle.attacker === userId || battle.defender === userId) {
          globalBattles[battleId] = {
            ...battle,
            attacker: battle.attacker === userId ? username: battle.attacker,
            defender: battle.defender === userId ? username: battle.defender
          };
          battlesMigrated = true;
        }
      }
      if (battlesMigrated) {
        saveDB("./lib/database/globalBattles.json", globalBattles);
        migrated = true;
        console.log(`✅ Migrasi battles: Riwayat pertempuran ${username}`);
      }

      // 7. MIGRASI TRANSFER HISTORY (Riwayat transfer saldo)
      let oldTransfer = loadDB("./lib/database/transfer.json") || {};
      let globalTransfer = loadDB("./lib/database/globalTransfer.json") || {};
      let transferMigrated = false;

      for (let [transferId, transfer] of Object.entries(oldTransfer)) {
        if (transfer.from === userId || transfer.to === userId) {
          globalTransfer[transferId] = {
            ...transfer,
            from: transfer.from === userId ? username: transfer.from,
            to: transfer.to === userId ? username: transfer.to
          };
          transferMigrated = true;
        }
      }
      if (transferMigrated) {
        saveDB("./lib/database/globalTransfer.json", globalTransfer);
        migrated = true;
      }

      // Simpan semua database yang berubah
      if (migrated) {
        saveDB("./lib/database/globalSaldo.json", globalSaldo);
        saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
        saveDB("./lib/database/globalVillages.json", globalVillages);
        saveDB("./lib/database/globalMarketplace.json", globalMarketplace);
        console.log(`🎉 Migrasi selesai untuk user: ${username}`);
      }

      return migrated;
      } catch (err) {}
    }

    // Fungsi migrasi massal untuk semua user yang belum termigrasi
    async function migrateAllUsers() {
      try {
      console.log("🔄 Memulai migrasi massal data...");

      let oldUsers = loadDB("./lib/database/userProfiles.json") || {};
      let oldSaldo = loadDB("./lib/database/saldo.json") || {};
      let oldFish = loadDB("./lib/database/fishInventory.json") || {};
      let oldVillage = loadDB("./lib/database/villages.json") || {};
      let oldMarketplace = loadDB("./lib/database/marketplace.json") || {};

      let migratedCount = 0;

      // Kumpulkan semua userId dari berbagai database
      let allUserIds = new Set();

      // Dari userProfiles
      for (let userId in oldUsers) allUserIds.add(userId);
      // Dari saldo
      for (let userId in oldSaldo) allUserIds.add(userId);
      // Dari fish inventory
      for (let userId in oldFish) allUserIds.add(userId);
      // Dari village
      for (let userId in oldVillage) allUserIds.add(userId);

      for (let userId of allUserIds) {
        // Cek apakah user sudah punya username
        if (!users[userId]) {
          // Buat username default dari nomor telepon
          let defaultUsername = userId.split("@")[0].slice(-10);
          let displayName = oldUsers[userId]?.displayName || defaultUsername;

          // Register user baru
          users[userId] = {
            username: defaultUsername,
            displayName: displayName,
            registeredAt: Date.now(),
            lastLogin: Date.now(),
            bio: oldUsers[userId]?.bio || "",
            level: oldUsers[userId]?.level || 1,
            exp: oldUsers[userId]?.exp || 0,
            wins: oldUsers[userId]?.wins || 0,
            losses: oldUsers[userId]?.losses || 0,
            globalId: `USER_${Date.now()}_${userId.slice(0, 5)}`
          };
          saveDB("./lib/database/users.json", users);
        }

        // Migrasi data user
        let migrated = await migrateUserData(userId);
        if (migrated) migratedCount++;
      }

      console.log(`✅ Migrasi selesai! ${migratedCount} user berhasil dimigrasi.`);
      return migratedCount;
      } catch (err) {}
    }

    function normalize(text) {
      return text
      .toLowerCase()
      .replace(/4/g,
        "a")
      .replace(/3/g,
        "e")
      .replace(/1/g,
        "i")
      .replace(/0/g,
        "o")
      .replace(/5/g,
        "s")
      .replace(/[^a-z]/g,
        "")
      .replace(/(.)\1+/g,
        "$1")
    }
    function normalizeList(arr) {
      return arr.map(v => normalize(v))
    }

    function randomThumb() {
      return thumbnailList[Math.floor(Math.random() * thumbnailList.length)]
    }

    function delay(ms) {
      return new Promise(res => setTimeout(res,
        ms))
    }

    // Cek Owner
    function isOwner(sender) {
      const nomor = sender.split("@")[0]
      const owners = ownerList.map(v => v.split("@")[0])
      return owners.includes(nomor)
    }

    async function broadcastGroup(text) {
      const groups = await socket.groupFetchAllParticipating()
      const ids = Object.keys(groups)

      for (const id of ids) {

        try {
          await socket.sendMessage(id, {
            image: {
              url: randomThumb()
            },
            caption: text
          })
          await delay(3000)
        } catch (err) {
          console.log("Gagal kirim ke:", id)
        }
      }
    }
    async function fishbotinfo(text) {
      const groups = await socket.groupFetchAllParticipating()
      const ids = Object.keys(groups)

      for (const id of ids) {

        try {
          await socket.sendMessage(id, {
            image: {
              url: "https://haddevf.github.io/4czla9wp5/file_00000000598c7208b430a3c56b5b2097.png"
            },
            caption: text
          })
          await delay(3000)
        } catch (err) {
          console.log("Gagal kirim ke:", id)
        }
      }
    }
    let saveTimeout

    function saveTrackerToxic() {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        saveDB("./lib/database/trackerToxic.json", toxicTracker)
      }, 1000)
    }
    function isPremiumGroup(idChat) {
      if (!premiumGroup[idChat]) return false

      const now = Date.now()
      const expired = premiumGroup[idChat].expired

      if (now > expired) {
        delete premiumGroup[idChat]
        saveDB("./lib/database/premiumGroup.json", premiumGroup)
        return false
      }

      return true
    }
    function normalizeJid(jid) {
      return jid.split(":")[0] + "@s.whatsapp.net"
    }
    // Helper function untuk format produk ke teks
    function formatProductText(product, no) {
      const rarityIcon = {
        basic: "⭐",
        rare: "✨",
        legendary: "🔥",
        mythic: "👑",
        secret: "💎"
      };

      let teks = `${no}. ${product.fishEmoji} *${product.fishName}* ${rarityIcon[product.rarity]}\n`;
      teks += `   📦 *${product.quantity} ekor* | 💰 *Rp${product.price.toLocaleString()}/ekor*\n`;
      teks += `   👤 *Penjual :* ${product.sellerName}\n`;
      teks += `   🆔 *ID :* \`${product.id}\`\n\n`;
      return teks;
    }
    function getRandomImage(folderPath) {
      const files = fs.readdirSync(folderPath)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))

      if (files.length === 0) {
        throw new Error("Tidak ada gambar di folder")
      }

      const randomFile = files[Math.floor(Math.random() * files.length)]

      return fs.readFileSync(path.join(folderPath, randomFile))
    }
    // Fungsi download media yang lebih stabil
    async function downloadMedia(message) {
      try {
        let mediaMessage = null;

        if (message.imageMessage) {
          mediaMessage = message.imageMessage;
        } else if (message.videoMessage) {
          mediaMessage = message.videoMessage;
        } else if (message.documentMessage) {
          mediaMessage = message.documentMessage;
        } else if (message.audioMessage) {
          mediaMessage = message.audioMessage;
        } else if (message.stickerMessage) {
          mediaMessage = message.stickerMessage;
        }

        if (!mediaMessage) return null;

        const stream = await socket.downloadMediaMessage(mediaMessage);
        return stream;
      } catch (err) {
        console.log("Download media error:", err);
        return null;
      }
    }

    function getRandomVillage(excludeUserId) {
      let availableVillages = [];
      for (let userId in villages) {
        if (userId !== excludeUserId && villages[userId] && villages[userId].resources) {
          availableVillages.push(userId);
        }
      }
      if (availableVillages.length === 0) return null;
      return availableVillages[Math.floor(Math.random() * availableVillages.length)];
    }
    // Hitung jumlah total pasukan
    function getTroopCount(troops) {
      return (troops.barbarian || 0) + (troops.archer || 0) + (troops.giant || 0) +
      (troops.goblin || 0) + (troops.wallBreaker || 0) + (troops.balloon || 0) +
      (troops.wizard || 0);
    }

    // Hitung kekuatan serangan
    function getAttackPower(troops) {
      let power = 0;
      power += (troops.barbarian || 0) * 10;
      power += (troops.archer || 0) * 15;
      power += (troops.giant || 0) * 30;
      power += (troops.goblin || 0) * 8;
      power += (troops.wallBreaker || 0) * 50;
      power += (troops.balloon || 0) * 80;
      power += (troops.wizard || 0) * 100;
      return power;
    }

    // Hitung kekuatan pertahanan
    function getDefensePower(village) {
      let power = 0;
      if (village.buildings.cannon) power += village.buildings.cannon.level * 50;
      if (village.buildings.archerTower) power += village.buildings.archerTower.level * 60;
      if (village.buildings.mortar) power += village.buildings.mortar.level * 100;
      if (village.buildings.wizardTower) power += village.buildings.wizardTower.level * 150;
      return power;
    }

    // Hitung bintang berdasarkan perbandingan kekuatan
    function calculateStars(attackPower, defensePower) {
      let ratio = attackPower / (defensePower + 1);
      if (ratio >= 3) return 3;
      if (ratio >= 1.5) return 2;
      if (ratio >= 0.8) return 1;
      return 0;
    }
    async function executeAttack(attackerUsername, defenderUsername, idChat, socket, pesan) {
      try {
        let attacker = globalVillages[attackerUsername];
        let defender = globalVillages[defenderUsername];

        // 🔥 CARI USER ID DARI USERNAME (tanpa fungsi getUserIdByUsername)
        let attackerUserId = null;
        let defenderUserId = null;
        for (let [userId, data] of Object.entries(users)) {
          if (data.username === attackerUsername) attackerUserId = userId;
          if (data.username === defenderUsername) defenderUserId = userId;
          if (attackerUserId && defenderUserId) break;
        }

        let attackerProfile = users[attackerUserId];
        let defenderProfile = users[defenderUserId];

        if (!attacker || !defender) return "*❌ Data desa tidak ditemukan!*";

        let totalTroops = getTroopCount(attacker.troops);
        if (totalTroops < 5) return "*❌ Pasukan tidak cukup!*";

        let attackPower = getAttackPower(attacker.troops);
        let defensePower = getDefensePower(defender);
        let stars = calculateStars(attackPower, defensePower);

        let maxLoot = 500 + defender.townHall * 100;
        let lootGold = Math.floor(maxLoot * (attackPower / (defensePower + attackPower)));
        lootGold = Math.min(lootGold, defender.resources.gold);

        // Update resources
        attacker.resources.gold += lootGold;
        defender.resources.gold -= lootGold;

        // Update trophies
        let trophyChange = stars === 3 ? 30: stars === 2 ? 15: stars === 1 ? 5: -10;
        attacker.trophies += trophyChange;
        defender.trophies -= trophyChange;
        if (attacker.trophies < 0) attacker.trophies = 0;
        if (defender.trophies < 0) defender.trophies = 0;

        // Shield untuk defender
        defender.shield = Date.now() + (12 * 60 * 60 * 1000);

        // Kurangi pasukan attacker
        let troopsLost = Math.floor(totalTroops * (0.3 + Math.random() * 0.4));
        let remainingTroops = totalTroops - troopsLost;
        let newTroops = {};
        for (let unit in attacker.troops) {
          let ratio = remainingTroops / totalTroops;
          newTroops[unit] = Math.floor(attacker.troops[unit] * ratio);
          if (newTroops[unit] < 0) newTroops[unit] = 0;
        }
        attacker.troops = newTroops;

        // Simpan battle record
        let battleId = Date.now();
        globalBattles[battleId] = {
          attacker: attackerUsername,
          defender: defenderUsername,
          stars: stars,
          loot: lootGold,
          attackPower: attackPower,
          defensePower: defensePower,
          troopsLost: troopsLost,
          time: battleId
        };

        saveDB("./lib/database/globalVillages.json", globalVillages);
        saveDB("./lib/database/globalBattles.json", globalBattles);

        let starEmoji = stars === 3 ? "⭐⭐⭐": stars === 2 ? "⭐⭐": stars === 1 ? "⭐": "💀";
        let resultText = stars >= 1 ? "✅ KEMENANGAN!": "❌ KEKALAHAN!";
        let attackerName = attackerProfile?.displayName || attackerUsername;
        let defenderName = defenderProfile?.displayName || defenderUsername;

        let teks = `*⚔️ HASIL PERTEMPURAN!* ⚔️\n\n`;
        teks += `*${starEmoji} ${resultText}*\n`;
        teks += `*🏆 Trophies :* ${trophyChange > 0 ? "+": ""}${trophyChange}\n`;
        teks += `*💰 Loot :* +${lootGold.toLocaleString()} gold\n`;
        teks += `*💪 Attack Power :* ${attackPower}\n`;
        teks += `*🛡️ Defense Power :* ${defensePower}\n`;
        teks += `*📉 Pasukan hilang :* ${troopsLost} unit\n`;
        teks += `*🪙 Sisa gold :* ${attacker.resources.gold.toLocaleString()}\n`;
        teks += `*🏆 Trophies sekarang :* ${attacker.trophies}\n\n`;
        teks += `*🛡️ ${defenderName} mendapat shield 12 jam!*`;

        return teks;

      } catch (err) {
        console.log("EXECUTE ATTACK ERROR:", err);
        return "*❌ Gagal execute attack!*\n\n*Error :* " + err.message;
      }
    }

    // ===================== EVENT PESAN =====================
    socket.ev.on("messages.upsert", async ({
      messages
    }) => {

      const pesan = messages[0]
      const botId = socket.user.id.split(":")[0] + "@s.whatsapp.net";
      const pengirim = pesan.key.fromMe ? botId: (pesan.key.participant || pesan.key.remoteJid);
      const nomorPengirim = pengirim.split("@")[0].split(":")[0];

      const idChat = pesan.key.remoteJid
      const dariGrup = idChat.endsWith("@g.us")
      const metadata = dariGrup ? await socket.groupMetadata(idChat): ""
      const daftarAdmin = dariGrup ? metadata.participants.filter(p => p.admin): []
      const adminGrup = dariGrup ? daftarAdmin.map(p => p.id): []
      const botAdmin = adminGrup.includes(botId)
      const pengirimAdmin = adminGrup.includes(pengirim)
      const kataPisahNormal = normalizeList(kataToxicPisah)
      const kataGabungNormal = normalizeList(kataToxicGabung)
      const kataPisahPremNormal = normalizeList(kataToxicPisahPrem)
      const kataGabungPremNormal = normalizeList(kataToxicGabungPrem)
      const botIdNumber = "6283866317501@s.whatsapp.net";
      const ownerLid = "66383635312837@lid";
      const isOwner = pengirim === botId || pengirim === ownerLid;
      let quotedMessage = pesan.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      let bankState = {};

      let isiPesan =
      pesan.message?.conversation ||
      pesan.message?.extendedTextMessage?.text ||
      pesan.message?.imageMessage?.caption ||
      pesan.message?.videoMessage?.caption ||
      pesan.message?.buttonsResponseMessage?.selectedButtonId ||
      pesan.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      ""
      const args = isiPesan.slice(prefix.length).trim().split(/ +/);
      if (!pesan.message) return
      if (pesan.key.remoteJid === "status@broadcast") return
      const minBet = 1000;
      const maxBet = 100000000000000000;
      const minInvest = 100000;
      const pajakEmas = 0.02;
      const pajakBitcoin = 0.02;
      const saldoSekarang = userSaldo[pengirim] || 0;
      let isAll = false;
      const ownerKey = "66383635312837@lid";
      let userKeyCek = pengirim;
      let targetUser = args[0];
      let namaTarget = targetUser.split("@")[0];
      let bannedUsers = loadDB("./lib/database/bannedUsers.json") || {};
      let bannedList = bannedUsers[idChat] || []

      // ===================== ANTI TOXIC =====================
      if (dariGrup && antiToxic[idChat]) {
        if (pengirim === botId) return
        const teks = isiPesan.toLowerCase()
        const kataPesan = teks.split(/\s+/)
        const teksNormal = normalize(teks)
        const kataPesanNormal = kataPesan.map(k => normalize(k))
        const isPrem = isPremiumGroup(idChat)
        const listPisah = isPrem ? kataPisahPremNormal: kataPisahNormal
        const listGabung = (isPrem ? kataGabungPremNormal: kataGabungNormal).filter(w => w.length > 3)
        // cocokkan kata utuh
        const toxicPisah = kataPesanNormal.some(kata => listPisah.includes(kata))
        // cocokkan kata gabung (pakai includes karena sudah dinormalisasi)
        const toxicGabung = listGabung.some(word => teksNormal.includes(word))
        if (toxicPisah || toxicGabung) {
          const limit = toxicLimitDB[idChat] || 5
          if (!toxicTracker[idChat]) toxicTracker[idChat] = {}
          if (!toxicTracker[idChat][pengirim]) {
            toxicTracker[idChat][pengirim] = 0
          }
          toxicTracker[idChat][pengirim]++
          saveTrackerToxic()

          const count = toxicTracker[idChat][pengirim]

          await socket.sendMessage(idChat, {
            delete: pesan.key
          })

          if (count < limit) {
            await socket.sendMessage(idChat, {
              text: `*⚠️ @${nomorPengirim} dilarang toxic.*\n\n*Peringatan ke (${count}/${limit}) sebelum dikeluarkan*`,
              mentions: [pengirim]
            })
          } else {
            try {
              await socket.sendMessage(idChat, {
                text: `*🚫 @${nomorPengirim} telah mencapai batas toxic (${limit}x) dan akan dikeluarkan!*`,
                mentions: [pengirim]
              })
              await socket.groupParticipantsUpdate(idChat, [pengirim], "remove")
              delete toxicTracker[idChat][pengirim]
              saveTrackerToxic()
            } catch (err) {
              console.log("Gagal mengeluarkan member")
            }
          }

          return
        }
      }

      // ===================== ANTI LINK =====================
      if (dariGrup && antiLink[idChat] && !pengirimAdmin) {

        // hanya cek user, bukan bot
        if (pengirim === botId) return // skip bot
        if (polaLink.test(isiPesan)) {
          await socket.sendMessage(idChat, {
            delete: pesan.key
          })

          await socket.sendMessage(idChat, {
            text: `*⚠️ @${nomorPengirim} dilarang kirim link di grup ini*`,
            mentions: [pengirim]
          })
        }
      }

      // Anti spam teks
      if (dariGrup && !botId) {
        try {
          // hanya proses kalau pesan teks
          const isText =
          pesan.message?.conversation ||
          pesan.message?.extendedTextMessage?.text
          const sekarang = Date.now()
          if (!spamTracker[idChat]) spamTracker[idChat] = {}
          if (!spamTracker[idChat][pengirim]) {
            spamTracker[idChat][pengirim] = {
              count: 0,
              time: sekarang
            }
          }
          const dataUser = spamTracker[idChat][pengirim]
          if (sekarang - dataUser.time < 10000) {
            dataUser.count++
          } else {
            dataUser.count = 1
            dataUser.time = sekarang
          }
          if (dataUser.count >= 7) {
            await socket.sendMessage(idChat, {
              text: `*⚠️ @${nomorPengirim} terdeteksi spam teks dan akan dikeluarkan*`,
              mentions: [pengirim]
            })
            await socket.groupParticipantsUpdate(idChat, [pengirim], "remove")
            delete spamTracker[idChat][pengirim]
            return
          }
        } catch (err) {
          console.log("Error : ", err)
        }}

      // Anti spam sticker
      if (dariGrup && pesan.message?.stickerMessage) {
        try {
          const sekarang = Date.now()

          if (!stickerSpamTracker[idChat]) stickerSpamTracker[idChat] = {}

          if (!stickerSpamTracker[idChat][pengirim]) {
            stickerSpamTracker[idChat][pengirim] = {
              count: 0,
              time: sekarang
            }
          }

          const dataUser = stickerSpamTracker[idChat][pengirim]

          if (sekarang - dataUser.time < 10000) {
            dataUser.count++
          } else {
            dataUser.count = 1
            dataUser.time = sekarang
          }

          if (dataUser.count >= 5) {
            await socket.sendMessage(idChat, {
              text: `*⚠️ @${nomorPengirim} terdeteksi spam sticker dan akan dikeluarkan*`,
              mentions: [pengirim]
            })
            await socket.groupParticipantsUpdate(idChat, [pengirim], "remove")
            delete stickerSpamTracker[idChat][pengirim]
            return
          }
        } catch (err) {
          console.log("Error : ", err)
        }}

      // Anti channel
      if (dariGrup && antiChannel[idChat] && !pengirimAdmin) {
        const context =
        pesan.message?.extendedTextMessage?.contextInfo ||
        pesan.message?.imageMessage?.contextInfo ||
        pesan.message?.videoMessage?.contextInfo ||
        pesan.message?.stickerMessage?.contextInfo

        const fromChannel = context?.forwardedNewsletterMessageInfo

        if (fromChannel) {
          await socket.sendMessage(idChat, {
            delete: pesan.key
          })
          await socket.sendMessage(idChat, {
            text: `*⚠️ Pesan dari saluran tidak diperbolehkan di grup ini*`
          }, {
            quoted: pesan
          })
          return
        }
      }

      // ===================== CEK USER BANNED =====================
      if (dariGrup) {

        // Cek apakah pengirim ada di daftar banned
        try {
          if (bannedList.includes(pengirim)) {
            // Hapus pesan user yang di-ban
            await socket.sendMessage(idChat, {
              delete: pesan.key
            });

            // Kirim peringatan (opsional, bisa diaktifkan/nonaktifkan)
            // await socket.sendMessage(idChat, {
            //   text: `*🚫 @${nomorPengirim} sedang dalam masa ban!*\n*Kamu tidak bisa mengirim pesan di grup ini.*`,
            //   mentions: [pengirim]
            // });

            return; // Hentikan proses lebih lanjut
          }
        } catch (err) {
          console.log("Error : ", err)
        }
      }

      // ===================== COMMAND =====================
      if (!isiPesan || typeof isiPesan !== "string") return
      if (!pesan || !pesan.message) return
      if (!socket.user) return

      if (!isiPesan.startsWith(prefix)) return // ✅ WAJIB

      // ===================== PROSES STATE BANK =====================
      if (bankState[pengirim] && !isiPesan.startsWith(prefix)) {
        let state = bankState[pengirim];
        let username = users[pengirim]?.username;

        if (!username) {
          await socket.sendMessage(idChat, {
            text: "*❌ Login dulu dengan /login!*"
          }, {
            quoted: pesan
          });
          delete bankState[pengirim];
          return;
        }

        // ========== BUAT REKENING ==========
        if (state.action === "BUATREK_WAIT_PASSWORD") {
          let password = isiPesan.trim();

          if (password.length < 4) {
            await socket.sendMessage(idChat, {
              text: "*❌ Password minimal 4 karakter! Coba lagi.*"
            }, {
              quoted: pesan
            });
            return;
          }

          if (bankData.accounts[password]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Password sudah terdaftar! Gunakan password lain.*"
            }, {
              quoted: pesan
            });
            return;
          }

          bankData.accounts[password] = {
            balance: 0,
            owner: username,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            totalDeposit: 0,
            totalWithdraw: 0
          };

          saveDB("./lib/database/bank.json", bankData);
          delete bankState[pengirim];

          await socket.sendMessage(idChat, {
            text: `*✅ REKENING BERHASIL DIBUKA!* ✅\n\n*🔐 Password: ${password}*\n*👤 Pemilik: @${username}*\n*💰 Saldo awal: Rp0*\n\n*⚠️ SIMPAN PASSWORD ANDA! JANGAN SAMPAI LUPA!*\n\n*📌 /deposit - Untuk menyetor uang*\n*📌 /cekbank - Untuk cek saldo*`
          }, {
            quoted: pesan
          });
          return;
        }

        // ========== DEPOSIT ==========
        if (state.action === "DEPOSIT_WAIT_PASSWORD") {
          let password = isiPesan.trim();
          let account = bankData.accounts[password];

          if (!account) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening tidak ditemukan! Coba lagi.*"
            }, {
              quoted: pesan
            });
            return;
          }

          if (account.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening ini bukan milik Anda!*"
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          state.action = "DEPOSIT_WAIT_AMOUNT";
          state.password = password;
          state.account = account;

          await socket.sendMessage(idChat, {
            text: `*💰 DEPOSIT TUNAI* 💰\n\n*🏦 Rekening: ${password}*\n*💰 Saldo saat ini: Rp${account.balance.toLocaleString()}*\n\n*📌 Masukkan jumlah yang ingin disetor:*\n*💰 Minimal deposit: Rp${(bankData.settings.minDeposit || 10000).toLocaleString()}*\n\n*Ketik /batal untuk membatalkan.*`
          }, {
            quoted: pesan
          });
          return;
        }

        if (state.action === "DEPOSIT_WAIT_AMOUNT") {
          let amount = parseInt(isiPesan.trim());
          let minDeposit = bankData.settings.minDeposit || 10000;

          if (isNaN(amount) || amount < minDeposit) {
            await socket.sendMessage(idChat, {
              text: `*❌ Minimal deposit Rp${minDeposit.toLocaleString()}! Masukkan jumlah yang valid.*`
            }, {
              quoted: pesan
            });
            return;
          }

          let userSaldo = globalSaldo[username] || 0;

          if (userSaldo < amount) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Saldo tunai Anda: Rp${userSaldo.toLocaleString()}*\n*📊 Butuh: Rp${amount.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          // Proses deposit
          globalSaldo[username] -= amount;
          state.account.balance += amount;
          state.account.totalDeposit += amount;
          state.account.lastLogin = Date.now();

          bankData.transactions.unshift({
            id: Date.now(),
            type: "DEPOSIT",
            password: state.password,
            owner: username,
            amount: amount,
            balance: state.account.balance,
            time: Date.now()
          });

          if (bankData.transactions.length > 100) bankData.transactions.pop();

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/bank.json", bankData);
          delete bankState[pengirim];

          await socket.sendMessage(idChat, {
            text: `*✅ DEPOSIT BERHASIL!* ✅\n\n*🏦 Rekening: ${state.password}*\n*💰 Jumlah: +Rp${amount.toLocaleString()}*\n*💳 Saldo rekening: Rp${state.account.balance.toLocaleString()}*\n*💵 Saldo tunai: Rp${(globalSaldo[username] || 0).toLocaleString()}*`
          }, {
            quoted: pesan
          });
          return;
        }

        // ========== WITHDRAW ==========
        if (state.action === "WITHDRAW_WAIT_PASSWORD") {
          let password = isiPesan.trim();
          let account = bankData.accounts[password];

          if (!account) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening tidak ditemukan! Coba lagi.*"
            }, {
              quoted: pesan
            });
            return;
          }

          if (account.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening ini bukan milik Anda!*"
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          state.action = "WITHDRAW_WAIT_AMOUNT";
          state.password = password;
          state.account = account;

          await socket.sendMessage(idChat, {
            text: `*💸 WITHDRAW TUNAI* 💸\n\n*🏦 Rekening: ${password}*\n*💰 Saldo rekening: Rp${account.balance.toLocaleString()}*\n*📉 Admin fee: Rp${(bankData.settings.adminFee || 1000).toLocaleString()}*\n\n*📌 Masukkan jumlah yang ingin ditarik:*\n*💰 Minimal withdraw: Rp${(bankData.settings.minWithdraw || 5000).toLocaleString()}*\n\n*Ketik /batal untuk membatalkan.*`
          }, {
            quoted: pesan
          });
          return;
        }

        if (state.action === "WITHDRAW_WAIT_AMOUNT") {
          let amount = parseInt(isiPesan.trim());
          let minWithdraw = bankData.settings.minWithdraw || 5000;
          let adminFee = bankData.settings.adminFee || 1000;

          if (isNaN(amount) || amount < minWithdraw) {
            await socket.sendMessage(idChat, {
              text: `*❌ Minimal withdraw Rp${minWithdraw.toLocaleString()}!*`
            }, {
              quoted: pesan
            });
            return;
          }

          let totalWithdraw = amount + adminFee;

          if (state.account.balance < totalWithdraw) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO REKENING TIDAK CUKUP!*\n\n*💰 Saldo rekening: Rp${state.account.balance.toLocaleString()}*\n*📊 Butuh: Rp${totalWithdraw.toLocaleString()} (termasuk admin fee)*`
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          // Proses withdraw
          state.account.balance -= totalWithdraw;
          state.account.totalWithdraw += amount;
          globalSaldo[username] = (globalSaldo[username] || 0) + amount;

          bankData.transactions.unshift({
            id: Date.now(),
            type: "WITHDRAW",
            password: state.password,
            owner: username,
            amount: amount,
            fee: adminFee,
            balance: state.account.balance,
            time: Date.now()
          });

          if (bankData.transactions.length > 100) bankData.transactions.pop();

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/bank.json", bankData);
          delete bankState[pengirim];

          await socket.sendMessage(idChat, {
            text: `*✅ WITHDRAW BERHASIL!* ✅\n\n*🏦 Rekening: ${state.password}*\n*💰 Jumlah: -Rp${amount.toLocaleString()}*\n*📉 Admin fee: Rp${adminFee.toLocaleString()}*\n*💳 Saldo rekening: Rp${state.account.balance.toLocaleString()}*\n*💵 Saldo tunai: Rp${(globalSaldo[username] || 0).toLocaleString()}*`
          }, {
            quoted: pesan
          });
          return;
        }

        // ========== CEK REKENING ==========
        if (state.action === "CEKBANK_WAIT_PASSWORD") {
          let password = isiPesan.trim();
          let account = bankData.accounts[password];

          if (!account) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening tidak ditemukan!*"
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          if (account.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening ini bukan milik Anda!*"
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          // Hitung bunga
          let lastLogin = account.lastLogin || account.createdAt;
          let daysDiff = Math.floor((Date.now() - lastLogin) / (24 * 60 * 60 * 1000));
          let interest = 0;

          if (daysDiff > 0 && bankData.settings.interestRate > 0) {
            interest = Math.floor(account.balance * (bankData.settings.interestRate / 100) * daysDiff);
            account.balance += interest;
            account.lastLogin = Date.now();
            saveDB("./lib/database/bank.json", bankData);
          } else {
            account.lastLogin = Date.now();
            saveDB("./lib/database/bank.json", bankData);
          }

          delete bankState[pengirim];

          let teks = `*🏦 INFORMASI REKENING* 🏦\n\n`;
          teks += `*🔐 Password: ${password}*\n`;
          teks += `*👤 Pemilik: @${username}*\n`;
          teks += `*💰 Saldo: Rp${account.balance.toLocaleString()}*\n`;
          teks += `*📅 Dibuka: ${new Date(account.createdAt).toLocaleDateString("id-ID")}*\n`;
          teks += `*📈 Total deposit: Rp${(account.totalDeposit || 0).toLocaleString()}*\n`;
          teks += `*📉 Total withdraw: Rp${(account.totalWithdraw || 0).toLocaleString()}*\n`;
          if (interest > 0) {
            teks += `*✨ Bunga (${bankData.settings.interestRate}%/hari): +Rp${interest.toLocaleString()}*\n`;
          }
          teks += `\n*📌 /deposit - Setor tunai*\n`;
          teks += `*📌 /withdraw - Tarik tunai*\n`;
          teks += `*📌 /transferbank - Transfer ke rekening lain*`;

          await socket.sendMessage(idChat, {
            text: teks, mentions: [pengirim]
          }, {
            quoted: pesan
          });
          return;
        }

        // ========== TRANSFER ==========
        if (state.action === "TRANSFER_WAIT_PASSWORD") {
          let password = isiPesan.trim();
          let account = bankData.accounts[password];

          if (!account) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening tidak ditemukan! Coba lagi.*"
            }, {
              quoted: pesan
            });
            return;
          }

          if (account.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening ini bukan milik Anda!*"
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          state.action = "TRANSFER_WAIT_TARGET";
          state.fromPassword = password;
          state.fromAccount = account;

          await socket.sendMessage(idChat, {
            text: `*💸 TRANSFER ANTAR REKENING* 💸\n\n*🏦 Rekening sumber: ${password}*\n*💰 Saldo: Rp${account.balance.toLocaleString()}*\n\n*📌 Masukkan password rekening tujuan:*\n\n*Ketik /batal untuk membatalkan.*`
          }, {
            quoted: pesan
          });
          return;
        }

        if (state.action === "TRANSFER_WAIT_TARGET") {
          let toPassword = isiPesan.trim();
          let toAccount = bankData.accounts[toPassword];

          if (!toAccount) {
            await socket.sendMessage(idChat, {
              text: "*❌ Rekening tujuan tidak ditemukan! Coba lagi.*"
            }, {
              quoted: pesan
            });
            return;
          }

          state.action = "TRANSFER_WAIT_AMOUNT";
          state.toPassword = toPassword;
          state.toAccount = toAccount;

          await socket.sendMessage(idChat, {
            text: `*💸 TRANSFER ANTAR REKENING* 💸\n\n*🏦 Dari: ${state.fromPassword} (${state.fromAccount.owner})*\n*🏦 Ke: ${toPassword} (${toAccount.owner})*\n*📉 Admin fee: Rp${(bankData.settings.adminFee || 1000).toLocaleString()}*\n\n*📌 Masukkan jumlah yang ingin ditransfer:*\n*💰 Minimal transfer: Rp10.000*\n\n*Ketik /batal untuk membatalkan.*`
          }, {
            quoted: pesan
          });
          return;
        }

        if (state.action === "TRANSFER_WAIT_AMOUNT") {
          let amount = parseInt(isiPesan.trim());
          let adminFee = bankData.settings.adminFee || 1000;

          if (isNaN(amount) || amount < 10000) {
            await socket.sendMessage(idChat, {
              text: "*❌ Minimal transfer Rp10.000!*"
            }, {
              quoted: pesan
            });
            return;
          }

          let totalTransfer = amount + adminFee;

          if (state.fromAccount.balance < totalTransfer) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Saldo: Rp${state.fromAccount.balance.toLocaleString()}*\n*📊 Butuh: Rp${totalTransfer.toLocaleString()} (termasuk admin fee)*`
            }, {
              quoted: pesan
            });
            delete bankState[pengirim];
            return;
          }

          // Proses transfer
          state.fromAccount.balance -= totalTransfer;
          state.toAccount.balance += amount;

          bankData.transactions.unshift({
            id: Date.now(),
            type: "TRANSFER",
            from: state.fromPassword,
            to: state.toPassword,
            fromOwner: username,
            toOwner: state.toAccount.owner,
            amount: amount,
            fee: adminFee,
            time: Date.now()
          });

          if (bankData.transactions.length > 100) bankData.transactions.pop();

          saveDB("./lib/database/bank.json", bankData);

          // Kirim notifikasi ke penerima
          let targetJid = getUserIdByUsername(state.toAccount.owner);
          if (targetJid) {
            await socket.sendMessage(targetJid, {
              text: `*💰 TRANSFER MASUK!* 💰\n\n*🏦 Dari rekening: ${state.fromPassword}*\n*👤 Dari: @${username}*\n*💵 Jumlah: +Rp${amount.toLocaleString()}*\n*💳 Saldo rekening Anda: Rp${state.toAccount.balance.toLocaleString()}*`
            }).catch(() => {});
          }

          delete bankState[pengirim];

          await socket.sendMessage(idChat, {
            text: `*✅ TRANSFER BERHASIL!* ✅\n\n*🏦 Dari rekening: ${state.fromPassword}*\n*🏦 Ke rekening: ${state.toPassword}*\n*👤 Penerima: @${state.toAccount.owner}*\n*💰 Jumlah: -Rp${amount.toLocaleString()}*\n*📉 Admin fee: Rp${adminFee.toLocaleString()}*\n*💳 Saldo rekening Anda: Rp${state.fromAccount.balance.toLocaleString()}*`
          }, {
            quoted: pesan
          });
          return;
        }
      }

      const command = args.shift().toLowerCase();
      const isBot = pesan.key.fromMe
      let jumlahDana = parseInt(args[0]);
      const headerMenu = `✨𝐁𝐎𝐓 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍✨\n\n*╭─────────────────────⪼*\n*│ ➤ Nama : ${namaBot}*\n*│ ➤ Owner : ${namaOwner}*\n*│ ➤ Status Bot : ${botMode && botMode.active ? "Aktif": "Nonaktif"}*\n*│ ➤ Version : ${versionBot}*\n*│ ➤ Update : ${update}*\n*╰──────────────────────*`
      const teksNote = `*📋 Note: Mohon tidak menjalankan beberapa perintah AI/Tools secara bersamaan untuk menghindari antrian proses dan potensi kegagalan sistem.*`
      const query = args.join(" ");

      // Pengecekan botMode - PERBAIKAN: tambahkan pengecekan undefined
      if (botMode && botMode.active === false && !isOwner) return
      if (!command) return;
      if (dariGrup && premiumGroup[idChat]) {
        const now = Date.now()
        const expired = premiumGroup[idChat].expired

        if (now > expired) {
          delete premiumGroup[idChat]
          saveDB("./lib/database/premiumGroup.json", premiumGroup)

          await socket.sendMessage(idChat, {
            text: "*⚠️ Premium group telah expired*"
          }, {
            quoted: pesan
          })
        }
      }

      // blok fitur premium kalau belum premium
      if (dariGrup && premiumOnly.includes(command)) {
        if (!isPremiumGroup(idChat)) {
          await socket.sendMessage(idChat, {
            text: "*❌ Fitur ini hanya untuk group premium*"
          }, {
            quoted: pesan
          })
          return
        }
      }

      // ===================== CEK USER MUTE =====================
      if (isMuted(pengirim) && !isOwner) {
        await socket.sendMessage(idChat, {
          text: "*🔇 AKUN ANDA TELAH DI BEKUKAN!*\n\n*📌 Anda tidak bisa menggunakan bot.*\n*📌 Hubungi owner untuk info lebih lanjut atau tunggu owner membuka akun anda.*"
        }, {
          quoted: pesan
        });
        return; // LANGSUNG RETURN, TIDAK PROSES COMMAND APAPUN
      }

      // ===================== CEK BAN NOBOT =====================
      if (dariGrup && isNobotActive(idChat) && !isOwner) {
        try {
  let commandName = command;
  
  // ✅ Jika command ADA di allowedCommands, maka BAN
  if (allowedCommands.includes(commandName)) {
    let isBanned = isBannedFromNobot(pengirim);
    
    if (!isBanned) {
      let username = users[pengirim]?.username;
      
      banUserFromNobot(pengirim, `Menggunakan command /${commandName} saat NOBOT aktif`);
      
      if (username) {
        muteUser(pengirim);
      }
    }
    
    return;
  }} catch (err) {
    console.log("Error : ", err)
  }
}
      switch (command) {

      case "onbot":
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus owner*"
          }, {
            quoted: pesan
          })
          break
        }
        try {
          botMode.active = true
          saveDB("./lib/database/botMode.json", botMode)
          await socket.sendMessage(idChat, {
            text: "*✅ Bot telah diaktifkan*",
            contextInfo: {
              externalAdReply: {
                title: "NEW MESSAGE",
                body: "Bot Developer : Kaelorix/Kael",
                thumbnailUrl: randomThumb(),
                sourceUrl: "https://whatsapp.com",
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          }, {
            quoted: pesan
          })
          await broadcastGroup("*📢 Bot telah di aktifkan kembali dari pusat*\n\n*[ MAINTENANCE DONE ]*")
        } catch (err) {
          console.log("Gagal mengirim pesan broadcastgroup")
        }
        break

      case "offbot":
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus owner*"
          }, {
            quoted: pesan
          })
          break
        }
        try {
          botMode.active = false
          saveDB("./lib/database/botMode.json", botMode)
          await socket.sendMessage(idChat, {
            text: "*❌ Bot telah dinonaktifkan*",
            contextInfo: {
              externalAdReply: {
                title: "NEW MESSAGE",
                body: "Bot Developer : Kaelorix/Kael",
                thumbnailUrl: randomThumb(),
                sourceUrl: "https://whatsapp.com",
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          }, {
            quoted: pesan
          })
          await broadcastGroup("*🔒 Bot telah di nonaktifkan dari pusat*\n\n*[ SEDANG MAINTENANCE ]*")
        } catch (err) {
          console.log("Gagal mengirim pesan broadcastgroup")
        }
        break

      case "start":
        const teksStart = `${headerMenu}\n\n*Auto Fitur :*\n- 𝗔𝘂𝘁𝗼 𝗚𝗿𝗲𝗲𝘁𝗶𝗻𝗴\n- 𝗔𝗻𝘁𝗶 𝗦𝗽𝗮𝗺 𝗧𝗲𝗸𝘀\n- 𝗔𝗻𝘁𝗶 𝗦𝗽𝗮𝗺 𝗦𝘁𝗶𝗰𝗸𝗲𝗿\n\n𝗖𝗼𝗺𝗺𝗮𝗻𝗱: \n- *${prefix}start - info bot (global)*\n- *${prefix}owner - nomor owner dan bot (global)*\n- *${prefix}menuall - (global)*\n- *${prefix}menugroup - (admin only)*\n- *${prefix}menutools - menu alat² berguna*\n- *${prefix}menuai - lihat menu khusus AI*\n- *${prefix}cekprem - cek akses group (admin only)*\n- *${prefix}aksespremium - list harga premium (admin only)*\n\n${teksNote}\n\n*© 2026 Kaelorix. All Right Reserved*`

        await socket.sendMessage(idChat, {
          image: {
            url: randomThumb()
          },
          caption: teksStart,
        }, {
          quoted: pesan
        })
        break

      case "menuall":
        const teksMenuAll = `${headerMenu}\n\n*Command default :* \n- *${prefix}start - info bot*\n- *${prefix}owner - nomor owner dan bot*\n\n*Command Group :*\n- *${prefix}kick - mengeluarkan member*\n- *${prefix}lock - tutup grup*\n- *${prefix}unlock - buka grup*\n- *${prefix}antitoxic on/off - hapus kata kasar*\n- *${prefix}antilink on/off - hapus link*\n- *${prefix}offbot - matikan bot*\n- *${prefix}onbot - hidupkan bot*\n- *${prefix}del - hapus pesan*\n- *${prefix}antichannel on/off - hapus pesan terusan dari saluran*\n- *${prefix}limittoxic - setel batasan toxic*\n- *${prefix}resettrackertoxic - hapus peringatan toxic semua member*\n- *${prefix}cekprem - cek akses group*\n- *${prefix}aksespremium - list harga premium*\n- *${prefix}idgc - id group*\n\n*Command Tools :*\n- *${prefix}ytsearch - cari video youtube*\n- *${prefix}tt - download video tiktok*\n- *${prefix}iqc*\n- *${prefix}pindl - download gambar pinterest*\n- *${prefix}scpin - cari gambar dari pinterest*\n- *${prefix}ytmp4 - download video youtube*\n- *${prefix}ytmp3 - download audio youtube*\n- *${prefix}berita - informasi berita terkini*\n- *${prefix}scgc - cari group global*\n- *${prefix}song - cari lagu*\n\n*Command Ai :*\n- *${prefix}mcai (pertanyaan)*\n- *${prefix}ai (pertanyaan)*\n- *${prefix}gemini (pertanyaan)*\n- *${prefix}public (pertanyaan)*\n- *${prefix}gita (pertanyaan)*\n- *${prefix}epsilon (peryanyaan)*\n- *${prefix}flux (prompt) - dalam pengembangan*\n- *${prefix}dolphin (pertanyaan)*\n\n*Command fun :*\n- *${prefix}mintatopup - kirim notif ke owner agar di topup kan*\n- *${prefix}ceksaldo - cek berapa saldo anda*\n- *${prefix}slot - mainkan slot dan menangkan saldo*\n- *${prefix}fishbot - Menu game fishbot*\n- *${prefix}tfsaldo - transfer saldo ke user lain*\n- *${prefix}topglobal - cek 10 orang terkaya global*\n- *${prefix}toplocal - cek orang terkaya di group*\n- *${prefix}saham - menu saham*\n- *${prefix}invest - menu investasi*\n- *${prefix}listcentang - List user yg mendapatkan centang resmi*\n- *${prefix}pinjam - Pinjam saldo*\n- *${prefix}bayarpinjam - Bayar pinjaman saldo*\n- *${prefix}cekpinjam - Cek status pinjaman*\n\n${teksNote}\n\n*© 2026 Kaelorix. All Right Reserved*`

        await socket.sendMessage(idChat, {
          image: {
            url: randomThumb()
          },
          caption: teksMenuAll,
        }, {
          quoted: pesan
        })
        break

      case "menugroup":
        const teksMenuGroup = `${headerMenu}\n\n𝗖𝗼𝗺𝗺𝗮𝗻𝗱: \n- *${prefix}start - info bot (admin only)*\n- *${prefix}owner - nomor owner dan bot (global)*\n- *${prefix}kick - mengeluarkan member (premium)*\n- *${prefix}lock - tutup grup (admin only)*\n- *${prefix}unlock - buka grup (admin only)*\n- *${prefix}antitoxic on/off - hapus kata kasar (admin only)*\n- *${prefix}antilink on/off - hapus link (premium)*\n- *${prefix}offbot - matikan bot (owner only)*\n- *${prefix}onbot - hidupkan bot (owner only)*\n- *${prefix}del - hapus pesan (premium)*\n- *${prefix}antichannel on/off - hapus pesan terusan dari saluran (admin only)*\n- *${prefix}limittoxic - setel batasan toxic (admin only)*\n- *${prefix}resettrackertoxic - hapus peringatan toxic semua member (admin only)*\n- *${prefix}idgc - id group (admin only)*\n\n*© 2026 Kaelorix. All Right Reserved*`

        await socket.sendMessage(idChat, {
          image: {
            url: randomThumb()
          },
          caption: teksMenuGroup,
        }, {
          quoted: pesan
        })
        break

      case "menutools":
        const teksMenuTools = `${headerMenu}\n\n𝗖𝗼𝗺𝗺𝗮𝗻𝗱: \n- *${prefix}ytsearch - Cari video youtube (free global)*\n- *${prefix}tt - Download video tiktok no watermsrk (premium global)*\n- *${prefix}pindl - download image/video pinterest*\n- *${prefix}scpin - cari gambar dari pinterest*\n- *${prefix}iqc (teks) - image message*\n- *${prefix}brat (teks) - bikin sticker*\n- *${prefix}scgc (nama grub) - cari group global*\n- *${prefix}ytmp4 - download video youtube*\n- *${prefix}ytmp3 - download audio youtube*\n- *${prefix}berita - informasi berita terkini*\n- *${prefix}song - cari lagu*\n\n${teksNote}\n\n*© 2026 Kaelorix. All Right Reserved*`

        await socket.sendMessage(idChat, {
          image: {
            url: randomThumb()
          },
          caption: teksMenuTools,
        }, {
          quoted: pesan
        })
        break

      case "menuai":
        const teksMenuAI = `${headerMenu}\n\n𝗖𝗼𝗺𝗺𝗮𝗻𝗱: \n- *${prefix}mcai (pertanyaan)*\n- *${prefix}ai (pertanyaan)*\n- *${prefix}gemini (pertanyaan)*\n- *${prefix}public (pertanyaan)*\n- *${prefix}gita (pertanyaan)*\n- *${prefix}epsilon (peryanyaan)*\n- *${prefix}flux (prompt) - dalam pengembangan*\n- *${prefix}dolphin (pertanyaan)*\n\n${teksNote}\n\n*© 2026 Kaelorix. All Right Reserved*`

        await socket.sendMessage(idChat, {
          image: {
            url: randomThumb()
          },
          caption: teksMenuAI,
        }, {
          quoted: pesan
        })
        break

      case "owner":
        const owner = `BEGIN:VCARD
        VERSION:3.0
        FN:Owner Bot
        TEL;type=CELL;type=VOICE;waid=6283866317462:+6283866317462
        END:VCARD`

        const bot = `BEGIN:VCARD
        VERSION:3.0
        FN:Nomor Bot
        TEL;type=CELL;type=VOICE;waid=6283866317501:+6283866317501
        END:VCARD`

        await socket.sendMessage(idChat, {
          contacts: {
            displayName: "Kontak Bot",
            contacts: [{
              vcard: owner
            }, {
              vcard: bot
            }]
          }
        }, {
          quoted: pesan
        })
        break

      case "kick":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan oleh admin*"
          }, {
            quoted: pesan
          })
          break
        }
        const mentions = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        // ambil metadata
        const metadataKick = await socket.groupMetadata(idChat)
        const peserta = metadataKick.participants
        // filter target valid
        const targets = mentions.filter(jid => {
          if (jid === botId) return false // ❌ skip bot
          const data = peserta.find(p => p.id === jid)
          if (!data) return false
          if (data.admin) return false // ❌ skip admin
          return true
        })
        if (targets.length === 0) {
          await socket.sendMessage(idChat, {
            text: "*Tidak ada user valid untuk dikick*"
          }, {
            quoted: pesan
          })
          break
        }
        // eksekusi kick
        await socket.groupParticipantsUpdate(idChat, targets, "remove")

        await socket.sendMessage(idChat, {
          text: `*Berhasil mengeluarkan ${targets.length} user ✅*`,
          contextInfo: {
            externalAdReply: {
              title: "NEW MESSAGE",
              body: "Bot Developer : Kaelorix/Kael",
              thumbnailUrl: randomThumb(),
              sourceUrl: "https://whatsapp.com",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          },
          mentions: targets
        }, {
          quoted: pesan
        })
        break

      case "lock":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan oleh admin*"
          }, {
            quoted: pesan
          })
          break
        }
        await socket.groupSettingUpdate(idChat, "announcement")
        await socket.sendMessage(idChat, {
          text: "*Group berhasil ditutup ✅*"
        }, {
          quoted: pesan
        })
        break

      case "unlock":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus admin*"
          }, {
            quoted: pesan
          })
          break
        }
        await socket.groupSettingUpdate(idChat, "not_announcement")
        await socket.sendMessage(idChat, {
          text: "*Group berhasil dibuka ✅*"
        }, {
          quoted: pesan
        })
        break

      case "sticker":
        if (!pesan.message.extendedTextMessage) {
          await socket.sendMessage(idChat, {
            text: "*Reply gambar dengan command /sticker*"
          }, {
            quoted: pesan
          })
          break
        }
        const quotedMsg = pesan.message.extendedTextMessage.contextInfo.quotedMessage
        if (!quotedMsg.imageMessage) {
          await socket.sendMessage(idChat, {
            text: "*Pesan yang direply harus gambar*"
          }, {
            quoted: pesan
          })
          break
        }
        const media = await socket.downloadMediaMessage({
          message: quotedMsg
        })
        const sticker = await sharp(media).resize(512, 512).webp().toBuffer()
        await socket.sendMessage(idChat, {
          sticker: sticker
        }, {
          quoted: pesan
        })
        break

      case "antitoxic":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan oleh admin*"
          }, {
            quoted: pesan
          })
          break
        }
        if (args[0] === "on") {
          antiToxic[idChat] = true
          await socket.sendMessage(idChat, {
            text: "*Anti toxic berhasil diaktifkan ✅*"
          }, {
            quoted: pesan
          })
          saveDB("./lib/database/antiToxic.json", antiToxic)
        } else if (args[0] === "off") {
          delete antiToxic[idChat]
          await socket.sendMessage(idChat, {
            text: "*Anti toxic berhasil dimatikan ✅*"
          }, {
            quoted: pesan
          })
          saveDB("./lib/database/antiToxic.json", antiToxic)
        } else {
          await socket.sendMessage(idChat, {
            text: "*Gunakan /antitoxic on atau /antitoxic off*"
          }, {
            quoted: pesan
          })
        }
        break

      case "antilink":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan oleh admin*"
          }, {
            quoted: pesan
          })
          break
        }
        if (args[0] === "on") {
          antiLink[idChat] = true
          await socket.sendMessage(idChat, {
            text: "*Anti link berhasil diaktifkan ✅*"
          }, {
            quoted: pesan
          })
          saveDB("./lib/database/antiLink.json", antiLink)
        } else if (args[0] === "off") {
          delete antiLink[idChat]
          await socket.sendMessage(idChat, {
            text: "*Anti link berhasil dimatikan ✅*"
          }, {
            quoted: pesan
          })
          saveDB("./lib/database/antiLink.json", antiLink)
        } else {
          await socket.sendMessage(idChat, {
            text: "*Gunakan /antilink on atau /antilink off*"
          }, {
            quoted: pesan
          })
        }
        break

      case "addowner":
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus owner*"
          }, {
            quoted: pesan
          })
          break
        }
        const mentionOwner = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid
        if (!mentionOwner || mentionOwner.length === 0) {
          await socket.sendMessage(idChat, {
            text: "*Tag nomor yang ingin dijadikan owner*\n\n*/addowner @user*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!ownerList.includes(mentionOwner[0])) {
          ownerList.push(mentionOwner[0])
        }
        await socket.sendMessage(idChat, {
          text: `*✅ @${mentionOwner[0].split("@")[0]} sekarang menjadi owner bot*`, mentions: [mentionOwner[0]]
        }, {
          quoted: pesan
        })
        break

      case "antichannel":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command hanya untuk admin*"
          }, {
            quoted: pesan
          })
          break
        }
        if (args[0] === "on") {
          antiChannel[idChat] = true
          await socket.sendMessage(idChat, {
            text: "*Anti channel berhasil diaktifkan ✅*"
          }, {
            quoted: pesan
          })
          saveDB("./lib/database/antiChannel.json", antiChannel)
        } else if (args[0] === "off") {
          delete antiChannel[idChat]
          await socket.sendMessage(idChat, {
            text: "*Anti channel berhasil dimatikan ✅*"
          }, {
            quoted: pesan
          })
          saveDB("./lib/database/antiChannel.json", antiChannel)
        } else {
          await socket.sendMessage(idChat, {
            text: "*Gunakan /antichannel on atau /antichannel off*"
          }, {
            quoted: pesan
          })
        }
        break

      case "del":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command ini hanya bisa digunakan oleh admin*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pesan.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          await socket.sendMessage(idChat, {
            text: "*Reply pesan yang ingin dihapus*"
          }, {
            quoted: pesan
          })
          break
        }
        const quotedDel = pesan.message.extendedTextMessage.contextInfo
        await socket.sendMessage(idChat, {
          delete: {
            remoteJid: idChat,
            fromMe: quotedDel.participant ? quotedDel.participant === socket.user.id: quotedDel.fromMe,
            id: quotedDel.stanzaId,
            participant: quotedDel.participant
          }
        })
        break

      case "bc":
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus owner*"
          }, {
            quoted: pesan
          })
          break
        }
        await socket.sendMessage(idChat, {
          react: {
            text: '🕖', key: pesan.key
          }
        });
        const teksBC = isiPesan.slice(prefix.length + command.length).trim()
        if (!teksBC) {
          await socket.sendMessage(idChat, {
            text: "*Contoh penggunaan :*\n\n/bc Halo semua grup!"
          }, {
            quoted: pesan
          })
          break
        }
        try {
          await broadcastGroup(teksBC)
          await socket.sendMessage(idChat, {
            text: "*Broadcast berhasil dikirim ke semua grup*"
          }, {
            quoted: pesan
          })
          await socket.sendMessage(idChat, {
            react: {
              text: '✅', key: pesan.key
            }
          });
        } catch (err) {
          await socket.sendMessage(idChat, {
            text: `*Gagal memgirim Broadcast*`
          }, {
            quoted: pesan
          })
        }
        break

      case "fishbotinfo":
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus owner*"
          }, {
            quoted: pesan
          })
          break
        }
        await socket.sendMessage(idChat, {
          react: {
            text: '🕖', key: pesan.key
          }
        });
        const teksBCD = isiPesan.slice(prefix.length + command.length).trim()
        if (!teksBCD) {
          await socket.sendMessage(idChat, {
            text: "*Contoh penggunaan :*\n\n/bc Halo semua grup!"
          }, {
            quoted: pesan
          })
          break
        }
        try {
          await fishbotinfo(teksBCD)
          await socket.sendMessage(idChat, {
            text: "*Broadcast berhasil dikirim ke semua grup*",
          }, {
            quoted: pesan
          })
          await socket.sendMessage(idChat, {
            react: {
              text: '✅', key: pesan.key
            }
          });
        } catch (err) {
          await socket.sendMessage(idChat, {
            text: `*Gagal memgirim Broadcast*`
          }, {
            quoted: pesan
          })
        }
        break

      case "cekowner":
        await socket.sendMessage(idChat, {
          text: `*Owner status : ${isOwner ? "YES ✅": "NO ❌"}*`
        }, {
          quoted: pesan
        })
        break

      case "limittoxic":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*Command hanya bisa digunakan di group*"
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Hanya admin yang bisa mengatur limit*"
          }, {
            quoted: pesan
          })
          break
        }
        const angka = parseInt(args[0])
        if (!angka || angka < 1) {
          await socket.sendMessage(idChat, {
            text: "*Masukkan angka valid*\n*Contoh: /limittoxic 5*"
          }, {
            quoted: pesan
          })
          break
        }
        toxicLimitDB[idChat] = angka
        saveDB("./lib/database/toxicLimit.json", toxicLimitDB)
        await socket.sendMessage(idChat, {
          text: `*Limit toxic berhasil di set ke ${angka} ✅*`
        }, {
          quoted: pesan
        })
        break

      case "resettrackertoxic":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: `*Command hanya bisa digunakan di group*`
          }, {
            quoted: pesan
          })
          break
        }
        if (!pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: `*Command khusus admin*`
          }, {
            quoted: pesan
          })
          break
        }
        // pastikan object ada
        if (!toxicTracker[idChat]) toxicTracker[idChat] = {}
        // reset semua member
        toxicTracker[idChat] = {}
        await socket.sendMessage(idChat, {
          text: `*Tracker toxic berhasil di reset ✅*\n\n*Peringatan toxic semua member kini menjadi 0*`
        }, {
          quoted: pesan
        })
        saveTrackerToxic()
        break

      case "ceklid":
        // Cek harus di grup
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*❌ Command ini hanya bisa digunakan di grup!*"
          }, {
            quoted: pesan
          });
          break;
        }

        let target;

        // 1. Ambil dari reply
        if (pesan.message?.extendedTextMessage?.contextInfo?.participant) {
          target = pesan.message.extendedTextMessage.contextInfo.participant;
        }
        // 2. Ambil dari tag
        else if (pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
          target = pesan.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // 3. Kalau nggak ada, cek diri sendiri (pengirim sudah include :xxxx jika ada)
        else {
          target = pengirim;
        }

        let role = "👤 *Anggota*";

        try {
          const grupMetadata = await socket.groupMetadata(idChat);
          // Cari member dengan JID apa adanya (tanpa dimodifikasi)
          const member = grupMetadata.participants.find(p => p.id === target);

          // Ambil nama
          if (member) {
            if (member.name) namaTarget = member.name;
            else if (member.notify) namaTarget = member.notify;
            else if (member.subject) namaTarget = member.subject;
            else namaTarget = target.split("@")[0].split(":")[0];
          }

          // Cek role (admin/owner)
          if (member && member.admin === "admin") {
            role = "👑 *Admin*";
          } else if (member && member.admin === "superadmin") {
            role = "⭐ *Owner Grup*";
          }

          // Cek apakah member itu bot
          if (target === botId) {
            role = "🤖 *Bot*";
          }

        } catch (e) {
          console.log("Error getting member info:", e);
        }

        // Tentukan tipe ID (berdasarkan format asli)
        let tipeId = "Unknown";
        let icon = "❓";

        if (target.includes("@lid")) {
          tipeId = "LID (Linking ID)";
          icon = "🔗";
        } else if (target.includes("@s.whatsapp.net")) {
          tipeId = "JID (Jabber ID)";
          icon = "📱";
        } else if (target.includes("@g.us")) {
          tipeId = "Group ID";
          icon = "👥";
        }

        // Buat teks output dengan JID ASLI (TIDAK DIHAPUS format :xxxx)
        const teks = `${icon} *🔍 CEK LID/JID*\n\n` +
        `*🎭 Role :* ${role}\n` +
        `*🆔 Tipe ID : ${tipeId}*\n` +
        `*📋 JID ASLI : https://${target}.com*\n\n` +
        `*📌 Cara penggunaan:*\n` +
        `-  *Reply pesan member : /ceklid*\n` +
        `-  *Tag member : /ceklid @member*\n` +
        `- *Tanpa reply/tag : cek ID sendiri*\n\n` +
        `*_© 2026 Kaelorix. All Right Reserved_*`;

        // Kirim pesan
        await socket.sendMessage(idChat, {
          text: teks,
          contextInfo: {
            mentionedJid: [target]
          }
        }, {
          quoted: pesan
        });
        break;

      case "ceksaldo":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username; // ✅ definisikan DI SINI dulu
          let saldo = globalSaldo[username] || 0;

          await socket.sendMessage(idChat, {
            text: `*💰 CEK SALDO* 💰\n\n*👤 Username : @${username}*\n*💎 Saldo Anda : Rp${saldo.toLocaleString()}*\n\n*📌 Tambah saldo dengan main game atau /claimsaldo*`,
            mentions: [pengirim]
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CEKSALDO ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal cek saldo!*\n\n*Error :* " + err.message
          }, {
            quoted: pesan
          });
        }
        break;

      case "tt":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*Command ini hanya bisa digunakan di group*"
            }, {
              quoted: pesan
            });
            break;
          }
          const hargatt = hargaCommand.tt || 0;
          if ((globalSaldo[username] || 0) < hargatt) {
            return socket.sendMessage(idChat, {
              text: `*❌ Saldo kurang! Butuh Rp${hargatt.toLocaleString()}*`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargatt;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Command salah!*\n*Contoh: /tt https://vt.tiktok.com/xxxx*"
            }, {
              quoted: pesan
            });
            break;
          }

          const tiktokUrl = args[0];

          if (!tiktokUrl.startsWith("https://")) {
            await socket.sendMessage(idChat, {
              text: "*Link Tautan Tidak Valid!*"
            }, {
              quoted: pesan
            });
            break;
          }

          await socket.sendMessage(idChat, {
            react: {
              text: '🕖', key: pesan.key
            }
          });

          // Gunakan fungsi yang sudah diimport
          const result = await tiktokDl(tiktokUrl);

          if (!result.status) {
            await socket.sendMessage(idChat, {
              text: "*Error! Gagal mengambil data TikTok*"
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
            break;
          }

          const isSlideshow = (result.durations == 0 || result.duration == "0 Seconds");

          if (isSlideshow && result.data && result.data.length > 0) {
            let no = 1;
            for (let img of result.data) {
              const caption = no === 1
              ? `*📸 TikTok Slideshow (${result.data.length} foto)*\n\nDownloaded by Bot`: `Foto ${no} dari ${result.data.length}`;

              await socket.sendMessage(idChat, {
                image: {
                  url: img.url
                },
                caption: caption
              }, {
                quoted: pesan
              });

              no++;
              await delay(800);
            }

            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });

          } else if (result.data && result.data.length > 0) {
            let videoData = result.data.find(e => e.type == "nowatermark_hd" || e.type == "nowatermark");

            if (!videoData) {
              await socket.sendMessage(idChat, {
                text: "*Error! Video tidak ditemukan*"
              }, {
                quoted: pesan
              });
              await socket.sendMessage(idChat, {
                react: {
                  text: '❌', key: pesan.key
                }
              });
              break;
            }

            await socket.sendMessage(idChat, {
              video: {
                url: videoData.url
              },
              caption: `*Video selesai di download*`,
              mimetype: "video/mp4"
            }, {
              quoted: pesan
            });

            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });

          } else {
            await socket.sendMessage(idChat, {
              text: "*Error! Tidak ada media yang ditemukan*"
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }

        } catch (err) {
          console.log("TT ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*Error saat mengunduh TikTok!*"
          }, {
            quoted: pesan
          });
          await socket.sendMessage(idChat, {
            react: {
              text: '❌', key: pesan.key
            }
          });
        }
        break;

      case "ytsearch":
        if (!users[pengirim]) {
          await socket.sendMessage(idChat, {
            text: "*❌ Login dulu dengan /login!*"
          }, {
            quoted: pesan
          });
          break;
        }
        if (!args[0]) {
          await socket.sendMessage(idChat, {
            text: "*Contoh: /ytsearch kicau mania*"
          }, {
            quoted: pesan
          });
          break;
        }
        let username = users[pengirim].username;
        const hargayts = hargaCommand.yts || 0;
        if ((globalSaldo[username] || 0) < hargayts) {
          return socket.sendMessage(idChat, {
            text: `❌ Saldo kurang! Butuh Rp${hargayts.toLocaleString()}`
          }, {
            quoted: pesan
          });
        }
        globalSaldo[username] -= hargayts;
        saveDB("./lib/database/globalSaldo.json", globalSaldo);

        await socket.sendMessage(idChat, {
          react: {
            text: '🕖', key: pesan.key
          }
        });

        try {
          const result = await yts(query);
          const videos = result.videos.slice(0, 10);

          if (videos.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*Tidak ada hasil ditemukan*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `🔍 *Hasil pencarian untuk : ${query}*\n\n`;

          for (let i = 0; i < videos.length; i++) {
            const v = videos[i];
            teks += `${i + 1}. *${v.title}*\n`;
            teks += `*Durasi : ${v.timestamp}*\n*Viewers : ${v.views}*\n`;
            teks += `*Link : ${v.url}*\n\n`;
          }

          teks += `*© 2026 Kaelorix. All Right Reserved*`;

          await socket.sendMessage(idChat, {
            react: {
              text: '✅', key: pesan.key
            }
          });

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });
        } catch (err) {
          console.log(err);
          await socket.sendMessage(idChat, {
            text: "*Error saat mencari!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "backupdb":
        // Hanya nomor BOT itu sendiri yang bisa menggunakan command ini
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*❌ Command ini hanya bisa digunakan oleh owner!*"
          }, {
            quoted: pesan
          });
          break;
        }

        // React loading
        await socket.sendMessage(idChat, {
          react: {
            text: '🕐', key: pesan.key
          }
        });

        try {
          // Folder database
          const dbFolder = './lib/database';
          if (!fs.existsSync(dbFolder)) {
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: "*❌ Folder database tidak ditemukan!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Buat file zip sementara
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const zipFileName = `backup_database_${timestamp}.zip`;
          const zipFilePath = path.join('./tmp', zipFileName);

          // Pastikan folder tmp ada
          if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');

          // Buat stream penulisan file
          const output = fs.createWriteStream(zipFilePath);
          const archive = archiver('zip', {
            zlib: {
              level: 9
            }
          });

          // Event listener untuk error
          archive.on('error', (err) => {
            throw err;
          });

          // Pipe output ke file
          archive.pipe(output);

          // Baca semua file di folder database (hanya file, tidak subfolder)
          const files = fs.readdirSync(dbFolder);
          let addedCount = 0;

          for (const file of files) {
            const filePath = path.join(dbFolder, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              archive.file(filePath, {
                name: file
              });
              addedCount++;
            }
          }

          // Finalisasi archive
          await new Promise((resolve, reject) => {
            output.on('close', resolve);
            archive.on('error', reject);
            archive.finalize();
          });

          const fileSize = fs.statSync(zipFilePath).size;

          // Kirim file zip ke nomor BOT sendiri
          await socket.sendMessage(ownerLid, {
            document: fs.readFileSync(zipFilePath),
            mimetype: 'application/zip',
            fileName: zipFileName,
            caption: `📦 *BACKUP DATABASE*\n\n*📅 Tanggal : ${new Date().toLocaleString("id-ID")}*\n*📁 Jumlah file : ${addedCount}*\n*💾 Ukuran : ${(fileSize / 1024).toFixed(2)} KB*\n\n*✅ Backup berhasil dibuat!*`
          });

          // Hapus file zip sementara
          fs.unlinkSync(zipFilePath);

          await socket.sendMessage(idChat, {
            react: {
              text: '✅', key: pesan.key
            }
          });
          // Balas ke chat perintah
          await socket.sendMessage(idChat, {
            text: `*✅ Backup berhasil!*\n\n*📦 File ZIP telah dikirim ke chat pribadi owner.*\n*📁 ${addedCount} file database dibackup.*\n*💾 Ukuran : ${(fileSize / 1024).toFixed(2)} KB*`
          }, {
            quoted: pesan
          });


        } catch (err) {
          console.log("BACKUP ERROR:", err);
          await socket.sendMessage(idChat, {
            text: `*❌ Gagal membuat backup:*\n${err.message}\n\nPastikan package 'archiver' sudah diinstall (npm install archiver)`
          }, {
            quoted: pesan
          });
          await socket.sendMessage(idChat, {
            react: {
              text: '❌', key: pesan.key
            }
          });
        }
        break;

      case "ai":
        try {
          // Ambil teks pertanyaan
          const teksAI = args.join(" ");
          const hargaai = hargaCommand.ai || 0;
          let username = users[pengirim].username;

          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if ((globalSaldo[username] || 0) < hargaai) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargaai.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[pengirim] -= hargaai;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          // Cek apakah ada gambar (reply atau langsung)
          let imageUrl = null;

          // Cek jika reply ke pesan yang berisi gambar
          if (quotedMessage && (quotedMessage.imageMessage || quotedMessage.videoMessage)) {
            const mediaMessage = quotedMessage.imageMessage || quotedMessage.videoMessage;
            if (mediaMessage && mediaMessage.url) {
              imageUrl = mediaMessage.url;
            } else {
              try {
                const mediaBuffer = await socket.downloadMediaMessage({
                  message: quotedMessage
                });
                const formData = new FormData();
                formData.append("image", Buffer.from(mediaBuffer), "image.jpg");
                const uploadRes = await axios.post("https://telegra.ph/upload", formData, {
                  headers: {
                    ...formData.getHeaders()
                  }
                });
                if (uploadRes.data && uploadRes.data[0] && uploadRes.data[0].src) {
                  imageUrl = "https://telegra.ph" + uploadRes.data[0].src;
                }
              } catch (err) {
                console.log("Gagal download gambar:", err);
              }
            }
          }

          // Cek jika pesan langsung berisi gambar (tanpa reply)
          if (!imageUrl && pesan.message?.imageMessage) {
            try {
              const mediaBuffer = await socket.downloadMediaMessage({
                message: pesan.message
              });
              const formData = new FormData();
              formData.append("image", Buffer.from(mediaBuffer), "image.jpg");
              const uploadRes = await axios.post("https://telegra.ph/upload", formData, {
                headers: {
                  ...formData.getHeaders()
                }
              });
              if (uploadRes.data && uploadRes.data[0] && uploadRes.data[0].src) {
                imageUrl = "https://telegra.ph" + uploadRes.data[0].src;
              }
            } catch (err) {
              console.log("Gagal upload gambar:", err);
            }
          }

          // Jika ada gambar tapi tidak ada teks, beri peringatan
          if (imageUrl && !teksAI) {
            await socket.sendMessage(idChat, {
              text: '*📸 Gambar diterima!*\n\n*Silakan tambahkan pertanyaan tentang gambar ini.*\n*Contoh: /ai Ini gambar apa?*'
            }, {
              quoted: pesan
            });
            break;
          }

          // Jika tidak ada teks dan tidak ada gambar
          if (!teksAI && !imageUrl) {
            await socket.sendMessage(idChat, {
              text: '*Contoh penggunaan:*\n\n1. *Tanya teks:* /ai Halo AI\n2. *Tanya gambar (reply):* Reply gambar lalu ketik /ai Ini gambar apa?\n3. *Tanya gambar (langsung):* Kirim gambar dengan caption /ai Ini gambar apa?'
            }, {
              quoted: pesan
            });
            break;
          }

          const promptAI = "Kamu adalah AI yang gaul banget, pake bahasa anak muda kek 'gue', 'gw', 'gua', 'lu', 'anjay', 'keknya', 'cuy', 'seru sih', 'gokil', 'btw', 'mabar', 'salting', 'baper', 'PHP', 'garing', 'elu', 'mood', 'spill', 'gaskan', 'siap bg', 'otw', 'pap', 'mepet', 'gercep'. Juga pake sedikit bahasa Sumatera Utara kayak 'kita', 'kau', 'aku', 'bisa', 'songong', 'kau lupa', 'nombok', 'bengap', 'ngantuk', 'mabuk', 'cakap', 'sibuk', 'tunggu dulu', 'jangan lupa', 'mari kita', 'makasih ya', 'nanti kita', sering kan pake emoji '🗿', '😹', '😑', banyakin bercanda dan pas bercanda pakai emoji '🗿', karna anak gaul suka itu. JANGAN BAKU, wajib gaul dan santai!";

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          // Kirim pesan loading pertama
          const loadingMsg = await socket.sendMessage(idChat, {
            text: '*Sending...*'
          }, {
            quoted: pesan
          });

          // Animasi loading (edit pesan setiap 1 detik)
          let dotCount = 0;
          const loadingInterval = setInterval(async () => {
            dotCount = (dotCount % 3) + 1;
            const dots = '.'.repeat(dotCount);
            const loadingText = `*↺ Thinking${dots}*`;
            try {
              await socket.sendMessage(idChat, {
                text: loadingText,
                edit: loadingMsg.key
              });
            } catch (err) {
              // Jika edit gagal, hentikan interval
              clearInterval(loadingInterval);
            }
          }, 1500);

          try {
            let url = `https://api.deline.web.id/ai/openai?text=${encodeURIComponent(teksAI || "Apa ini?")}&prompt=${encodeURIComponent(promptAI)}`;

            if (imageUrl) {
              url += `&image=${encodeURIComponent(imageUrl)}`;
            }

            const res = await axios.get(url, {
              timeout: 3600000
            });
            const data = res.data;

            // Hentikan animasi loading
            clearInterval(loadingInterval);

            if (!data.status || !data.result) {
              await socket.sendMessage(idChat, {
                react: {
                  text: '❌', key: pesan.key
                }
              });
              await socket.sendMessage(idChat, {
                text: '*❌ Maaf cuy, AI-nya lagi error nih. Coba lagi ntar ya!*',
                edit: loadingMsg.key
              });
              break;
            }

            let jawaban = data.result;

            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });

            // Edit pesan loading menjadi jawaban
            await socket.sendMessage(idChat, {
              text: `*AI ASSISTANT*\n\n${jawaban}`,
              edit: loadingMsg.key,
              contextInfo: {
                externalAdReply: {
                  title: "AI VISION",
                  body: imageUrl ? "Menganalisis gambar...": "AI Assistant",
                  thumbnailUrl: imageUrl || randomThumb(),
                  sourceUrl: "https://whatsapp.com",
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            });


          } catch (err) {
            console.log("AI ERROR:", err.message);
            clearInterval(loadingInterval);

            await socket.sendMessage(idChat, {
              text: '*❌ Error nih cuy, API-nya lagi down atau waktu habis. Coba lagi ntar ya!*',
              edit: loadingMsg.key
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }
        } catch (err) {
          console.log(err)
        }
        break;

      case "gemini":
        try {
          const hargagemini = hargaCommand.gemini || 0;
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if ((globalSaldo[username] || 0) < hargagemini) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargagemini.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargagemini;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          // Ambil teks pertanyaan
          const teksGemini = args.join(" ");

          // Cek apakah ada gambar (reply atau langsung)
          let geminiImageUrl = null;
          let geminiQuotedMessage = pesan.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          let hasImage = false;

          // Cek jika reply ke pesan yang berisi gambar
          if (geminiQuotedMessage && (geminiQuotedMessage.imageMessage || geminiQuotedMessage.videoMessage)) {
            hasImage = true;
            const mediaMessage = geminiQuotedMessage.imageMessage || geminiQuotedMessage.videoMessage;
            if (mediaMessage && mediaMessage.url) {
              geminiImageUrl = mediaMessage.url;
            } else {
              try {
                const mediaBuffer = await socket.downloadMediaMessage({
                  message: geminiQuotedMessage
                });
                const formData = new FormData();
                formData.append("image", Buffer.from(mediaBuffer), "image.jpg");
                const uploadRes = await axios.post("https://telegra.ph/upload", formData, {
                  headers: {
                    ...formData.getHeaders()
                  }
                });
                if (uploadRes.data && uploadRes.data[0] && uploadRes.data[0].src) {
                  geminiImageUrl = "https://telegra.ph" + uploadRes.data[0].src;
                }
              } catch (err) {
                console.log("Gagal download gambar gemini:", err);
              }
            }
          }

          // Cek jika pesan langsung berisi gambar (tanpa reply)
          if (!geminiImageUrl && pesan.message?.imageMessage) {
            hasImage = true;
            try {
              const mediaBuffer = await socket.downloadMediaMessage({
                message: pesan.message
              });
              const formData = new FormData();
              formData.append("image", Buffer.from(mediaBuffer), "image.jpg");
              const uploadRes = await axios.post("https://telegra.ph/upload", formData, {
                headers: {
                  ...formData.getHeaders()
                }
              });
              if (uploadRes.data && uploadRes.data[0] && uploadRes.data[0].src) {
                geminiImageUrl = "https://telegra.ph" + uploadRes.data[0].src;
              }
            } catch (err) {
              console.log("Gagal upload gambar gemini:", err);
            }
          }

          // Jika ada gambar tapi tidak ada teks
          if (hasImage && !teksGemini) {
            await socket.sendMessage(idChat, {
              text: '*📸 Gambar diterima!*\n\n*Silakan tambahkan pertanyaan tentang gambar ini.*\n*Contoh: /gemini Ini gambar apa?*'
            }, {
              quoted: pesan
            });
            break;
          }

          // Jika tidak ada teks dan tidak ada gambar
          if (!teksGemini && !hasImage) {
            await socket.sendMessage(idChat, {
              text: '*Contoh penggunaan :*\n\n1. *Tanya teks : /gemini Harga bitcoin hari ini*\n2. *Tanya gambar (reply) : Reply gambar lalu ketik /gemini Ini gambar apa?*\n3. *Tanya gambar (langsung) : Kirim gambar dengan caption /gemini Ini gambar apa?*'
            }, {
              quoted: pesan
            });
            break;
          }

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          // Kirim pesan loading pertama
          const loadingMsgGemini = await socket.sendMessage(idChat, {
            text: '*Sending...*'
          }, {
            quoted: pesan
          });

          // Animasi loading (edit pesan setiap 1 detik)
          let dotCountGemini = 0;
          const loadingIntervalGemini = setInterval(async () => {
            dotCountGemini = (dotCountGemini % 3) + 1;
            const dots = '.'.repeat(dotCountGemini);
            const loadingText = `*↺ Thinking${dots}*`;
            try {
              await socket.sendMessage(idChat, {
                text: loadingText,
                edit: loadingMsgGemini.key
              });
            } catch (err) {
              clearInterval(loadingIntervalGemini);
            }
          }, 1500);

          try {
            // Bangun URL query
            let queryGemini = teksGemini;

            // Jika ada gambar, tambahkan deskripsi ke query
            if (hasImage && geminiImageUrl) {
              queryGemini = `[Gambar: ${geminiImageUrl}] ${teksGemini}`;
            }

            // Panggil API Gemini (Bard Google)
            const response = await axios.get(
              `https://api-faa.my.id/faa/gemini-ai?text=${encodeURIComponent(queryGemini)}`,
              {
                timeout: 3600000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              }
            );

            // Hentikan animasi loading
            clearInterval(loadingIntervalGemini);

            const data = response.data;

            // Cek struktur response (sesuaikan dengan format API)
            let jawabanGemini = "";

            if (data && typeof data === 'object') {
              // Coba beberapa kemungkinan struktur response
              if (data.result) jawabanGemini = data.result;
              else if (data.response) jawabanGemini = data.response;
              else if (data.answer) jawabanGemini = data.answer;
              else if (data.message) jawabanGemini = data.message;
              else if (data.content) jawabanGemini = data.content;
              else if (data.text) jawabanGemini = data.text;
              else if (data.data && data.data.result) jawabanGemini = data.data.result;
              else if (typeof data === 'string') jawabanGemini = data;
              else jawabanGemini = JSON.stringify(data);
            } else if (typeof data === 'string') {
              jawabanGemini = data;
            } else {
              jawabanGemini = "*Maaf, saya tidak bisa memproses permintaan saat ini.*";
            }

            // React sukses
            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });

            // Edit pesan loading menjadi jawaban
            await socket.sendMessage(idChat, {
              text: `*Google Gemini AI*\n\n${jawabanGemini}`,
              edit: loadingMsgGemini.key,
              contextInfo: {
                externalAdReply: {
                  title: "GOOGLE GEMINI",
                  body: hasImage ? "Menganalisis gambar...": "AI Assistant",
                  thumbnailUrl: geminiImageUrl || randomThumb(),
                  sourceUrl: "https://gemini.google.com",
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            });


          } catch (err) {
            console.log("GEMINI ERROR:", err.message);

            // Hentikan animasi loading
            clearInterval(loadingIntervalGemini);

            let errorMsg = "*❌ Error Google Gemini AI:*\n\n";

            if (err.code === "ECONNABORTED") {
              errorMsg += "*Waktu koneksi habis. Silakan coba lagi.*";
            } else if (err.response?.status === 404) {
              errorMsg += "*Endpoint API tidak ditemukan.*";
            } else if (err.response?.status === 500 || err.response?.status === 503) {
              errorMsg += "*Server API sedang sibuk. Coba lagi nanti.*";
            } else if (err.response?.status === 429) {
              errorMsg += "*Terlalu banyak permintaan. Coba lagi beberapa saat.*";
            } else if (err.message?.includes("ECONNREFUSED")) {
              errorMsg += "*Gagal terhubung ke server API.*";
            } else {
              errorMsg += `*Gagal : ${err.message}*`;
            }

            errorMsg += "\n\n*_Tips : Coba lagi nanti atau gunakan pertanyaan yang lebih sederhana._*";

            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: errorMsg,
              edit: loadingMsgGemini.key
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "public":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /public Halo, apa kabar?*"
            }, {
              quoted: pesan
            });
            break;
          }
          let username = users[pengirim].username;
          const hargapublic = hargaCommand.public || 0;
          if ((globalSaldo[username] || 0) < hargapublic) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargapublic.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargapublic;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          const publicQuery = args.join(" ");

          // Kirim pesan loading pertama
          const loadingMsgPublic = await socket.sendMessage(idChat, {
            text: '*Sending...*'
          }, {
            quoted: pesan
          });

          // Animasi loading (edit pesan setiap 1.5 detik)
          let dotCountPublic = 0;
          const loadingIntervalPublic = setInterval(async () => {
            dotCountPublic = (dotCountPublic % 3) + 1;
            const dots = '.'.repeat(dotCountPublic);
            const loadingText = `*↺ Thinking${dots}*`;
            try {
              await socket.sendMessage(idChat, {
                text: loadingText,
                edit: loadingMsgPublic.key
              });
            } catch (err) {
              clearInterval(loadingIntervalPublic);
            }
          }, 1500);

          try {
            const response = await axios.get(
              `https://api-faa.my.id/faa/publicai?text=${encodeURIComponent(publicQuery)}`,
              {
                timeout: 360000
              }
            );

            const data = response.data;
            clearInterval(loadingIntervalPublic);

            if (data && data.status === true && data.result) {
              let jawaban = data.result;

              await socket.sendMessage(idChat, {
                react: {
                  text: '✅', key: pesan.key
                }
              });

              // Edit pesan loading menjadi jawaban
              await socket.sendMessage(idChat, {
                text: `*Public AI*\n\n${jawaban}`,
                edit: loadingMsgPublic.key,
                contextInfo: {
                  externalAdReply: {
                    title: "PUBLIC AI",
                    body: "AI Assistant",
                    thumbnailUrl: randomThumb(),
                    sourceUrl: "https://whatsapp.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              });
            } else {
              throw new Error("Respon tidak valid");
            }
          } catch (err) {
            console.log("PUBLIC AI ERROR:", err.message);
            clearInterval(loadingIntervalPublic);
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: "*❌ Error Public AI. Silakan coba lagi nanti.*",
              edit: loadingMsgPublic.key
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "gita":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /gita Apa makna kehidupan?*"
            }, {
              quoted: pesan
            });
            break;
          }
          let username = users[pengirim].username;
          const hargagita = hargaCommand.gita || 0;
          if ((globalSaldo[username] || 0) < hargagita) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargagita.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargagita;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          const gitaQuery = args.join(" ");

          // Kirim pesan loading pertama
          const loadingMsgGita = await socket.sendMessage(idChat, {
            text: '*Sending...*'
          }, {
            quoted: pesan
          });

          // Animasi loading (edit pesan setiap 1.5 detik)
          let dotCountGita = 0;
          const loadingIntervalGita = setInterval(async () => {
            dotCountGita = (dotCountGita % 3) + 1;
            const dots = '.'.repeat(dotCountGita);
            const loadingText = `*↺ Thinking${dots}*`;
            try {
              await socket.sendMessage(idChat, {
                text: loadingText,
                edit: loadingMsgGita.key
              });
            } catch (err) {
              clearInterval(loadingIntervalGita);
            }
          }, 1500);

          try {
            const response = await axios.get(
              `https://api-faa.my.id/faa/gita-ai?text=${encodeURIComponent(gitaQuery)}`,
              {
                timeout: 360000
              }
            );

            const data = response.data;
            clearInterval(loadingIntervalGita);

            if (data && data.status === true && data.result) {
              let jawaban = data.result;

              await socket.sendMessage(idChat, {
                react: {
                  text: '✅', key: pesan.key
                }
              });

              // Edit pesan loading menjadi jawaban
              await socket.sendMessage(idChat, {
                text: `*Gita AI*\n\n${jawaban}`,
                edit: loadingMsgGita.key,
                contextInfo: {
                  externalAdReply: {
                    title: "GITA GPT",
                    body: "Bhagavad Gita AI",
                    thumbnailUrl: randomThumb(),
                    sourceUrl: "https://whatsapp.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              });
            } else {
              throw new Error("Respon tidak valid");
            }
          } catch (err) {
            console.log("GITA AI ERROR:", err.message);
            clearInterval(loadingIntervalGita);
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: "*❌ Error Gita AI. Silakan coba lagi nanti.*",
              edit: loadingMsgGita.key
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "epsilon":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /epsilon Halo, apa kabar?*"
            }, {
              quoted: pesan
            });
            break;
          }
          let username = users[pengirim].username;
          const hargaepsilon = hargaCommand.epsilon || 0;
          if ((globalSaldo[username] || 0) < hargaepsilon) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargaepsilon.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargaepsilon;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          const epsilonQuery = args.join(" ");

          // Kirim pesan loading pertama
          const loadingMsgEpsilon = await socket.sendMessage(idChat, {
            text: '*Sending...*'
          }, {
            quoted: pesan
          });

          // Animasi loading (edit pesan setiap 1.5 detik)
          let dotCountEpsilon = 0;
          const loadingIntervalEpsilon = setInterval(async () => {
            dotCountEpsilon = (dotCountEpsilon % 3) + 1;
            const dots = '.'.repeat(dotCountEpsilon);
            const loadingText = `*↺ Thinking${dots}*`;
            try {
              await socket.sendMessage(idChat, {
                text: loadingText,
                edit: loadingMsgEpsilon.key
              });
            } catch (err) {
              clearInterval(loadingIntervalEpsilon);
            }
          }, 1500);

          try {
            const response = await axios.get(
              `https://api-faa.my.id/faa/epsilon-ai?text=${encodeURIComponent(epsilonQuery)}`,
              {
                timeout: 360000
              }
            );

            const data = response.data;
            clearInterval(loadingIntervalEpsilon);

            if (data && data.status === true && data.result) {
              let jawaban = data.result;

              await socket.sendMessage(idChat, {
                react: {
                  text: '✅', key: pesan.key
                }
              });

              // Edit pesan loading menjadi jawaban
              await socket.sendMessage(idChat, {
                text: `*Epsilon AI*\n\n${jawaban}`,
                edit: loadingMsgEpsilon.key,
                contextInfo: {
                  externalAdReply: {
                    title: "EPSILON AI",
                    body: "AI Assistant",
                    thumbnailUrl: randomThumb(),
                    sourceUrl: "https://whatsapp.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              });
            } else {
              throw new Error("Respon tidak valid");
            }
          } catch (err) {
            console.log("EPSILON AI ERROR:", err.message);
            clearInterval(loadingIntervalEpsilon);
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: "*❌ Error Epsilon AI (Endpoint mungkin bermasalah). Silakan coba lagi nanti.*",
              edit: loadingMsgEpsilon.key
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "dolphin":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /dolphin Halo, apa kabar?*"
            }, {
              quoted: pesan
            });
            break;
          }
          let username = users[pengirim].username;
          const hargadolphin = hargaCommand.dolphin || 0;
          if ((globalSaldo[username] || 0) < hargadolphin) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargadolphin.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargadolphin;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          const dolphinQuery = args.join(" ");

          // Kirim pesan loading pertama
          const loadingMsgDolphin = await socket.sendMessage(idChat, {
            text: '*Sending...*'
          }, {
            quoted: pesan
          });

          // Animasi loading (edit pesan setiap 1.5 detik)
          let dotCountDolphin = 0;
          const loadingIntervalDolphin = setInterval(async () => {
            dotCountDolphin = (dotCountDolphin % 3) + 1;
            const dots = '.'.repeat(dotCountDolphin);
            const loadingText = `*↺ Thinking${dots}*`;
            try {
              await socket.sendMessage(idChat, {
                text: loadingText,
                edit: loadingMsgDolphin.key
              });
            } catch (err) {
              clearInterval(loadingIntervalDolphin);
            }
          }, 1500);

          try {
            const response = await axios.get(
              `https://api-faa.my.id/faa/dolphin-ai?text=${encodeURIComponent(dolphinQuery)}`,
              {
                timeout: 360000
              }
            );

            const data = response.data;
            clearInterval(loadingIntervalDolphin);

            if (data && data.status === true && data.result) {
              let jawaban = data.result;
              if (jawaban.length > 6000) jawaban = jawaban.substring(0, 6000) + "\n\n...*(dipotong)*";

              await socket.sendMessage(idChat, {
                react: {
                  text: '✅', key: pesan.key
                }
              });

              // Edit pesan loading menjadi jawaban
              await socket.sendMessage(idChat, {
                text: `*Dolphin AI*\n\n${jawaban}`,
                edit: loadingMsgDolphin.key,
                contextInfo: {
                  externalAdReply: {
                    title: "DOLPHIN AI",
                    body: "AI Assistant",
                    thumbnailUrl: randomThumb(),
                    sourceUrl: "https://whatsapp.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              });
            } else {
              throw new Error("Respon tidak valid");
            }
          } catch (err) {
            console.log("DOLPHIN AI ERROR:", err.message);
            clearInterval(loadingIntervalDolphin);
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: "*❌ Error Dolphin AI (Endpoint mungkin bermasalah). Silakan coba lagi nanti.*",
              edit: loadingMsgDolphin.key
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "slot":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0] || isNaN(args[0])) {
            await socket.sendMessage(idChat, {
              text: `*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh : /slot 1000*\n*💰 Taruhan minimal : Rp${minBet}*\n*💰 Taruhan maksimal : Rp${maxBet}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let bet = parseInt(args[0]);

          if (bet < minBet) {
            await socket.sendMessage(idChat, {
              text: `*❌ TARUHAN TERLALU KECIL!*\n\n*💰 Minimal taruhan : ${minBet}*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (bet > maxBet) {
            await socket.sendMessage(idChat, {
              text: `*❌ TARUHAN TERLALU BESAR!*\n\n*💰 Maksimal taruhan : ${maxBet}*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Konversi pengirim ke format @lid untuk key di database
          let userKey = pengirim;
          let username = users[pengirim].username;

          if (!globalSaldo[username] || globalSaldo[username] < bet) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Saldo Anda : Rp${(globalSaldo[userKey] || 0).toLocaleString()}*\n*🎰 Taruhan : Rp${bet.toLocaleString()}*\n\n*📌 Gunakan /claimsaldo untuk klaim saldo gratis!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Daftar emoji slot
          const emojis = ["🍒",
            "🍊",
            "🍋",
            "🍉",
            "⭐",
            "💎",
            "7️⃣",
            "🔔",
            "🎰"];

          const result = [
            emojis[Math.floor(Math.random() * emojis.length)],
            emojis[Math.floor(Math.random() * emojis.length)],
            emojis[Math.floor(Math.random() * emojis.length)]
          ];

          let multiplier = 0;
          let winAmount = 0;
          let status = "";

          if (result[0] === result[1] && result[1] === result[2]) {
            if (result[0] === "7️⃣") {
              multiplier = 10;
              status = "🔥 *JACKPOT SUPER!* 🔥";
            } else if (result[0] === "💎") {
              multiplier = 8;
              status = "💎 *JACKPOT DIAMOND!* 💎";
            } else if (result[0] === "⭐") {
              multiplier = 6;
              status = "⭐ *JACKPOT STAR!* ⭐";
            } else {
              multiplier = 5;
              status = "🎉 *JACKPOT!* 🎉";
            }
          } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
            multiplier = 2;
            status = "🎊 *WIN! (2 sama)* 🎊";
          } else {
            multiplier = 0;
            status = "😭 *YOU LOSE!* 😭";
          }

          if (multiplier > 0) {
            winAmount = bet * multiplier;
            globalSaldo[username] = (globalSaldo[username] || 0) + winAmount;
          } else {
            winAmount = -bet;
            globalSaldo[username] = (globalSaldo[username] || 0) - bet;
          }
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          const slotDisplay = `
          *┌─────┬─────┬─────┐*
          *│  ${result[0]}  │  ${result[1]}  │  ${result[2]}  |*
          *└─────┴─────┴─────┘*
          `;

          await socket.sendMessage(idChat, {
            text: `*🎰 SLOT MACHINE 🎰*\n\n${slotDisplay}\n\n${status}\n\n*💰 Taruhan : Rp${bet.toLocaleString()}*\n*🎯 Multiplier : ${multiplier > 0 ? `${multiplier}x`: "0x"}*\n*💵 Menang : Rp${winAmount > 0 ? `+${winAmount.toLocaleString()}`: winAmount.toLocaleString()}*\n*💳 Saldo baru : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n*📌 Ketik /slot (jumlah) untuk bermain lagi*`
          }, {
            quoted: pesan
          });
        } catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "addprem": {
          try {
            const botId = socket.user.id.split(":")[0] + "@s.whatsapp.net"

            // hanya nomor bot
            if (!isOwner) {
              await socket.sendMessage(idChat, {
                text: "*Command khusus owner*"
              }, {
                quoted: pesan
              })
              break
            }

            if (!args[0] || !args[1]) {
              await socket.sendMessage(idChat, {
                text: "*Format: /addprem [idgrup] [hari]*\n*Contoh: /addprem 12036xxxxx@g.us 30*"
              }, {
                quoted: pesan
              })
              break
            }

            const targetGroup = args[0]
            const day = parseInt(args[1])

            if (isNaN(day)) {
              await socket.sendMessage(idChat, {
                text: "*Masukkan jumlah hari yang valid*"
              }, {
                quoted: pesan
              })
              break
            }

            const expired = Date.now() + (day * 24 * 60 * 60 * 1000)

            premiumGroup[targetGroup] = {
              expired
            }

            saveDB("./lib/database/premiumGroup.json", premiumGroup)

            await socket.sendMessage(idChat, {
              text: `*✅ Group premium aktif*\n\n*ID: ${targetGroup}*\n*Expired: ${day} hari*`
            }, {
              quoted: pesan
            })
          } catch (err) {
            console.log("Error")
          }
          break
        }

      case "idgc":
        try {
          if (!pengirimAdmin) {
            await socket.sendMessage(idChat, {
              text: "*Hanya admin yang bisa cek ID group*"
            }, {
              quoted: pesan
            })
            break
          }
          await socket.sendMessage(idChat, {
            text: `${idChat}`
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Error")
        }
        break

      case "cekprem":
        try {
          if (!dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*Command ini hanya untuk group*"
            }, {
              quoted: pesan
            })
            break
          }
          if (!premiumGroup[idChat]) {
            await socket.sendMessage(idChat, {
              text: "*Group ini bukan premium*\n\n*📞 Order premium :*\nwa.me/6283866317501"
            }, {
              quoted: pesan
            })
            break
          }
          const sisa = premiumGroup[idChat].expired - Date.now()
          let waktu

          if (sisa >= 24 * 60 * 60 * 1000) {
            const hari = Math.ceil(sisa / (24 * 60 * 60 * 1000))
            waktu = `${hari} hari`
          } else {
            const jam = Math.ceil(sisa / (60 * 60 * 1000))
            waktu = `${jam} jam`
          }
          await socket.sendMessage(idChat, {
            text: `*✅ Group premium aktif*\n*Sisa masa aktif: ${waktu}*`
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Error")
        }
        break

      case "listgc": {
          try {
            if (!isOwner) {
              await socket.sendMessage(idChat, {
                text: "*Command khusus nomor bot*"
              }, {
                quoted: pesan
              })
              break
            }
            const groups = await socket.groupFetchAllParticipating()
            const ids = Object.keys(groups)
            if (ids.length === 0) {
              await socket.sendMessage(idChat, {
                text: "*Bot tidak berada di group manapun*"
              }, {
                quoted: pesan
              })
              break
            }
            let teks = `*📋 LIST GROUP BOT (${
            ids.length})*\n\n`
            let no = 1
            for (const id of ids) {
              const nama = groups[id].subject || "Tanpa Nama"
              // cek premium
              const isPrem = isPremiumGroup(id)
              let status = "❌ Non-Premium"
              if (isPrem) {
                const sisa = premiumGroup[id].expired - Date.now()
                const hari = Math.ceil(sisa / (24 * 60 * 60 * 1000))
                status = `✅ Premium (${hari} hari)`
              }
              teks += `${no}. *${nama}*\n*ID: https://${id}*\n*Status: ${status}*\n\n`
              no++
            }
            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            })
          } catch (err) {
            console.log(err)
            await socket.sendMessage(idChat, {
              text: "*Gagal mengambil data group*"
            }, {
              quoted: pesan
            })
          }
          break
        }
        break

      case "aksespremium":
        try {
          await socket.sendMessage(idChat, {
            text: "*List akses premium :*\n\n- *3 hari = 2k*\n- *7 hari = 4k*\n- *15 hari = 8k*\n- *30 hari = 15k*\n\n*Benefit premium group :*\n- *Unlock fitur premium*\n- *Fitur keamanan lebih kompleks*\n- *Fitur keamanan lebih ketat*\n- *Mendeteksi lebih banyak kata toxic dari sebelumnya*\n\n*Order chat nomor ini :*\nwa.me/6283866317501"
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Error")
        }
        break

      case "delprem": {
          try {
            // hanya bot (biar konsisten dengan premiumgroup)
            if (!isOwner) {
              await socket.sendMessage(idChat, {
                text: "*Command khusus owner*"
              }, {
                quoted: pesan
              })
              break
            }
            if (!args[0]) {
              await socket.sendMessage(idChat, {
                text: "*Format: /delprem [idgrup]*\n*Contoh: /delprem 12036xxxxx@g.us*"
              }, {
                quoted: pesan
              })
              break
            }
            const targetGroup = args[0]
            if (!premiumGroup[targetGroup]) {
              await socket.sendMessage(idChat, {
                text: "*Group tersebut bukan premium*"
              }, {
                quoted: pesan
              })
              break
            }
            delete premiumGroup[targetGroup]
            saveDB("./lib/database/premiumGroup.json", premiumGroup)
            await socket.sendMessage(idChat, {
              text: `*✅ Premium group berhasil dihapus*\n\n*ID: ${targetGroup}*`
            }, {
              quoted: pesan
            })
            break
          } catch (err) {
            console.log("Error")
          }
        }

      case "tesowner":
        try {
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*Kamu bukan owner*"
            }, {
              quoted: pesan
            })
            return
          }
          await socket.sendMessage(idChat, {
            text: `*Kamu adalah owner*\n*Id : ${pengirim}*`
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Error")
        }
        break

      case "mintatopup":
        try {
          let username = users[pengirim].username;
          await socket.sendMessage(ownerLid, {
            text: `*Ada yg minta topup ni bg.*\n\n*ID : https://${pengirim}.com*\n*Username : ${username}*`
          })
          await socket.sendMessage(idChat, {
            text: `*Berhasil meminta topup ke owner, mohon tidak spam request, jika spam tidak akan di layani.*\n\n*Silahkan command /ceksaldo secara berkala untuk memastikan saldo sudah masuk atau belum*`
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Error")
        }
        break

        // ===================== COMMAND =====================

      case "ping":
        try {
          const startTime = Date.now();

          const pingMsg = await socket.sendMessage(idChat, {
            text: "🏓 *Pinging...*"
          }, {
            quoted: pesan
          });

          const pingTime = Date.now() - startTime;

          const runtime = process.uptime();
          const jam = Math.floor(runtime / 3600);
          const menit = Math.floor((runtime % 3600) / 60);
          const seconds = Math.floor(runtime % 60);
          const runtimeText = `${jam} jam ${menit} menit ${seconds} detik`;

          const memoryUsage = process.memoryUsage();
          const ramUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
          const ramTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
          const ramRss = (memoryUsage.rss / 1024 / 1024).toFixed(2);

          const cpuUsage = process.cpuUsage();
          const cpuUser = (cpuUsage.user / 1000 / 1000).toFixed(2);
          const cpuSystem = (cpuUsage.system / 1000 / 1000).toFixed(2);

          // ✅ LANGSUNG PAKAI execAsync (sudah didefinisikan di atas)
          let diskInfo = "Tidak tersedia";
          try {
            const {
              stdout
            } = await execAsync("df -h /");
            const lines = stdout.trim().split("\n");
            const diskData = lines[1].split(/\s+/);
            diskInfo = `${diskData[2]} / ${diskData[1]}`;
          } catch (err) {
            diskInfo = "Gagal membaca disk";
          }

          await socket.sendMessage(idChat, {
            text: `📡 *Ping : ${pingTime}ms*\n\n` +
            `⏱️ *Runtime Bot :*\n*${runtimeText}*\n\n` +
            `💾 *RAM Usage :*\n` +
            `   • *Heap Used : ${ramUsed} MB*\n` +
            `   • *Heap Total : ${ramTotal} MB*\n` +
            `   • *RSS : ${ramRss} MB*\n\n` +
            `⚙️ *CPU Usage :*\n` +
            `   • *User : ${cpuUser} ms*\n` +
            `   • *System : ${cpuSystem} ms*\n\n` +
            `💿 *Disk Usage :*\n` +
            `   • *${diskInfo}*\n\n` +
            `📅 *Server Time : ${new Date().toLocaleString("id-ID")}*`,
            edit: pingMsg.key
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("PING ERROR:", err);
        }
        break;

        // ===================== FITUR FISHBOT =====================

      case "sethargaemas":
        // Cuma owner yang bisa
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*❌ Command khusus owner!*"
          }, {
            quoted: pesan
          });
          break;
        }

        if (!args[0] || isNaN(args[0])) {
          await socket.sendMessage(idChat, {
            text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh: /sethargaemas 1500000*\n*📌 Harga saat ini: Rp" + hargaEmas.toLocaleString() + "/gram*"
          }, {
            quoted: pesan
          });
          break;
        }

        let newHargaEmas = parseInt(args[0]);

        if (newHargaEmas < 100000) {
          await socket.sendMessage(idChat, {
            text: "*❌ Harga terlalu rendah!*\n*💰 Minimal Rp100.000/gram*"
          }, {
            quoted: pesan
          });
          break;
        }

        if (newHargaEmas > 10000000) {
          await socket.sendMessage(idChat, {
            text: "*❌ Harga terlalu tinggi!*\n*💰 Maksimal Rp10.000.000/gram*"
          }, {
            quoted: pesan
          });
          break;
        }

        const hargaLamaEmas = hargaEmas;
        hargaEmas = newHargaEmas;

        // Simpan ke database
        hargaDb.emas = hargaEmas;
        hargaDb.lastUpdate = Date.now();
        saveDB("./lib/database/harga.json", hargaDb);

        // Catat history perubahan (opsional)
        let historyHarga = loadDB("./lib/database/historyHarga.json") || {};
        historyHarga[Date.now()] = {
          type: "EMAS",
          lama: hargaLamaEmas,
          baru: hargaEmas,
          diubahOleh: pengirim,
          waktu: Date.now()
        };
        saveDB("./lib/database/historyHarga.json", historyHarga);

        await socket.sendMessage(idChat, {
          text: `*✅ HARGA EMAS BERHASIL DIUBAH!*\n\n*📉 Harga lama: Rp${hargaLamaEmas.toLocaleString()}/gram*\n*📈 Harga baru: Rp${hargaEmas.toLocaleString()}/gram*\n*👤 Diubah oleh: ${nomorPengirim}*\n*⏰ Waktu: ${new Date().toLocaleString("id-ID")}*`,
          react: {
            text: '✅', key: pesan.key
          }
        }, {
          quoted: pesan
        });
        break;

      case "sethargabtc":
        // Cuma owner yang bisa
        if (!isOwner) {
          await socket.sendMessage(idChat, {
            text: "*❌ Command khusus owner!*"
          }, {
            quoted: pesan
          });
          break;
        }

        if (!args[0] || isNaN(args[0])) {
          await socket.sendMessage(idChat, {
            text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh: /sethargabtc 1000000000*\n*📌 Harga saat ini: Rp" + hargaBitcoin.toLocaleString() + "/BTC*"
          }, {
            quoted: pesan
          });
          break;
        }

        let newHargaBtc = parseInt(args[0]);

        if (newHargaBtc < 10000000) {
          await socket.sendMessage(idChat, {
            text: "*❌ Harga terlalu rendah!*\n*💰 Minimal Rp10.000.000/BTC*"
          }, {
            quoted: pesan
          });
          break;
        }

        if (newHargaBtc > 5000000000) {
          await socket.sendMessage(idChat, {
            text: "*❌ Harga terlalu tinggi!*\n*💰 Maksimal Rp5.000.000.000/BTC*"
          }, {
            quoted: pesan
          });
          break;
        }

        const hargaLamaBtc = hargaBitcoin;
        hargaBitcoin = newHargaBtc;

        // Simpan ke database
        let hargaDbBtc = loadDB("./lib/database/harga.json") || {};
        hargaDbBtc.bitcoin = hargaBitcoin;
        hargaDbBtc.lastUpdate = Date.now();
        saveDB("./lib/database/harga.json", hargaDbBtc);

        // Catat history perubahan (opsional)
        let historyHargaBtc = loadDB("./lib/database/historyHarga.json") || {};
        historyHargaBtc[Date.now()] = {
          type: "BITCOIN",
          lama: hargaLamaBtc,
          baru: hargaBitcoin,
          diubahOleh: pengirim,
          waktu: Date.now()
        };
        saveDB("./lib/database/historyHarga.json", historyHargaBtc);

        await socket.sendMessage(idChat, {
          text: `*✅ HARGA BITCOIN BERHASIL DIUBAH!*\n\n*📉 Harga lama: Rp${hargaLamaBtc.toLocaleString()}/BTC*\n*📈 Harga baru: Rp${hargaBitcoin.toLocaleString()}/BTC*\n*👤 Diubah oleh: ${nomorPengirim}*\n*⏰ Waktu: ${new Date().toLocaleString("id-ID")}*`,
          react: {
            text: '✅', key: pesan.key
          }
        }, {
          quoted: pesan
        });
        break;

      case "fishinfo":
        try {
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*📌 Contoh : /fishinfo Crimson Clown*"
            }, {
              quoted: pesan
            });
            break;
          }

          let fishCatalogInfo = loadDB("./lib/database/fishCatalog.json") || {};
          let fishNameInfo = args.join(" ").toLowerCase();
          let foundFish = null;
          let foundRarity = null;

          let rarityOrderInfo = ["basic",
            "rare",
            "legendary",
            "mythic",
            "secret"];
          for (let rarity of rarityOrderInfo) {
            let fish = (fishCatalogInfo.fish[rarity] || []).find(f => f.name.toLowerCase() === fishNameInfo);
            if (fish) {
              foundFish = fish;
              foundRarity = rarity;
              break;
            }
          }

          if (!foundFish) {
            await socket.sendMessage(idChat, {
              text: `*❌ Ikan "${args.join(" ")}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          const rarityIconInfo = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };
          const rarityTextInfo = {
            basic: "Basic",
            rare: "Rare",
            legendary: "LEGENDARY",
            mythic: "MYTHIC",
            secret: "SECRET"
          };
          const avgPrice = Math.floor((foundFish.min + foundFish.max) / 2);

          await socket.sendMessage(idChat, {
            text: `*🐟 INFO IKAN ${rarityIconInfo[foundRarity]}*\n\n*Nama : ${foundFish.emoji} ${foundFish.name}*\n*Rarity : ${rarityTextInfo[foundRarity]}*\n*Lokasi : ${foundFish.location}*\n*Harga : Rp${avgPrice.toLocaleString()} (Rp${foundFish.min.toLocaleString()} - Rp${foundFish.max.toLocaleString()})*\n\n*📌 Ketik /fish ${foundFish.location} untuk mendapatkannya!*`
          }, {
            quoted: pesan
          });
        } catch (err) {
          console.log("Error", err)
        }
        break;

      case "hargafish":
        try {
          // Validasi struktur baru
          if (!fishCatalog.fish) {
            throw new Error("Struktur fishCatalog tidak sesuai");
          }

          // ===================== HELPER =====================
          function getAveragePrice(level) {
            let list = fishCatalog.fish[level] || [];
            if (list.length === 0) return 0;

            let total = 0;
            for (let fish of list) {
              total += (fish.min + fish.max) / 2;
            }
            return Math.floor(total / list.length);
          }

          function getPriceRange(level) {
            let list = fishCatalog.fish[level] || [];
            if (list.length === 0) return "Rp0 - Rp0";

            let minPrice = Infinity;
            let maxPrice = -Infinity;

            for (let fish of list) {
              if (fish.min < minPrice) minPrice = fish.min;
              if (fish.max > maxPrice) maxPrice = fish.max;
            }

            return `Rp${minPrice.toLocaleString()} - Rp${maxPrice.toLocaleString()}`;
          }

          // ===================== LEVEL CONFIG =====================
          let levels = ["basic",
            "rare",
            "legendary",
            "mythic",
            "secret"];

          let levelNames = {
            basic: "⭐ Basic",
            rare: "✨ Rare",
            legendary: "🔥 Legendary",
            mythic: "👑 Mythic",
            secret: "💎 Secret"
          };

          let levelIcons = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };

          // ===================== KUMPULAN IKAN =====================
          let allFish = [];

          for (let level of levels) {
            let list = fishCatalog.fish[level] || [];
            for (let fish of list) {
              allFish.push({
                ...fish,
                level,
                levelIcon: levelIcons[level],
                levelName: levelNames[level]
              });
            }
          }

          // Sort global
          allFish.sort((a, b) => {
            let avgA = (a.min + a.max) / 2;
            let avgB = (b.min + b.max) / 2;
            return avgA - avgB;
          });

          // ===================== BUILD TEXT =====================
          let teksHarga = `🎣 *DAFTAR HARGA IKAN* 🎣\n\n`;

          for (let level of levels) {
            let levelFish = allFish.filter(f => f.level === level);
            if (levelFish.length > 0) {
              teksHarga += `${levelIcons[level]} *${levelNames[level]}*\n`;
              teksHarga += `*📊 Rentang : ${getPriceRange(level)}*\n`;
              teksHarga += `*💰 Rata-rata : Rp${getAveragePrice(level).toLocaleString()}*\n\n`;

              let sortedLevelFish = [...levelFish]
              .sort((a, b) => ((b.min + b.max) / 2) - ((a.min + a.max) / 2))
              .slice(0, 20);

              teksHarga += `📋 *Contoh ikan :*\n`;
              for (let fish of sortedLevelFish) {
                let avgPrice = Math.floor((fish.min + fish.max) / 2);
                teksHarga += `   • *${fish.emoji} ${fish.name} : Rp${avgPrice.toLocaleString()}*\n`;
              }

              teksHarga += `\n`;
            }
          }

          // ===================== TOTAL =====================
          let totalBasic = fishCatalog.fish.basic?.length || 0;
          let totalRare = fishCatalog.fish.rare?.length || 0;
          let totalLegendary = fishCatalog.fish.legendary?.length || 0;
          let totalMythic = fishCatalog.fish.mythic?.length || 0;
          let totalSecret = fishCatalog.fish.secret?.length || 0;

          let totalSemua = totalBasic + totalRare + totalLegendary + totalMythic + totalSecret;

          teksHarga += `*📊 TOTAL IKAN DI KOLEKSI*\n`;
          teksHarga += `*⭐ Basic : ${totalBasic} jenis*\n`;
          teksHarga += `*✨ Rare : ${totalRare} jenis*\n`;
          teksHarga += `*🔥 Legendary : ${totalLegendary} jenis*\n`;
          teksHarga += `*👑 Mythic : ${totalMythic} jenis*\n`;
          teksHarga += `*💎 Secret : ${totalSecret} jenis*\n`;
          teksHarga += `*🎣 Total : ${totalSemua} jenis ikan*\n\n`;

          teksHarga += `📌 *Ketik /fish untuk mulai mancing!*`;

          await socket.sendMessage(idChat, {
            text: teksHarga
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("HARGA FISH ERROR:", err);
          await socket.sendMessage(idChat, {
            text: `❌ *Error!*\n\n*Gagal mengambil daftar harga ikan.*\n\n📌 *Coba lagi nanti atau ketik /fish untuk mulai mancing.*`
          }, {
            quoted: pesan
          });
        }
        break;

      case "fishbot":
        const teksFish = `*🎣 FISHBOT GAME 🎣*\n\n*Command :*\n- *${prefix}fish - Mulai memancing*\n- *${prefix}fishinfo (nama) - Cari info ikan*\n- *${prefix}jualfish (nama) (jumlah) - Menjual ikan*\n- *${prefix}tffish @tag (nama) (jumlah) - Transfer ikan ke user lain*\n- *${prefix}cekmap - Info map kamu sekarang*\n- *${prefix}movemap (nama) - pindah map*\n- *${prefix}listfish - Lihat inventory mu*\n- *${prefix}hargafish - Lihat berapa harga ikan*\n- *${prefix}afkfish - afk memancing*\n\n*© 2026 Kaelorix. All Right Reserved*`
        try {
          await socket.sendMessage(idChat, {
            text: teksFish
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Error", err)
        }
        break

        // ===================== BAN & UNBAN USER =====================

      case "ban":
        try {
          // Cek harus di grup
          if (!dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan di grup!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah pengirim admin
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan oleh owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Ambil target user
          let targetUser = null;
          let mentionBan = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionBan) {
            targetUser = mentionBan;
          } else if (args[0]) {
            targetUser = args[0];
            if (!targetUser.includes("@") && !targetUser.includes("@lid")) {
              targetUser = targetUser + "@lid";
            }
          }

          if (!targetUser) {
            await socket.sendMessage(idChat, {
              text: "*❌ TAG USER YANG INGIN DI-BAN!*\n\n*📌 Contoh : /ban @user*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Tidak bisa ban diri sendiri
          if (targetUser === pengirim) {
            await socket.sendMessage(idChat, {
              text: "*❌ TIDAK BISA MEMBAN DIRI SENDIRI!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Tidak bisa ban bot
          if (targetUser === botId) {
            await socket.sendMessage(idChat, {
              text: "*❌ TIDAK BISA MEMBAN BOT!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Inisialisasi array untuk grup ini jika belum ada
          if (!bannedUsers[idChat]) {
            bannedUsers[idChat] = [];
          }

          // Cek apakah user sudah ter-ban
          if (bannedUsers[idChat].includes(targetUser)) {
            await socket.sendMessage(idChat, {
              text: `*❌ USER @${targetUser.split("@")[0]} SUDAH TER-BAN DI GRUP INI!*`,
              mentions: [targetUser]
            }, {
              quoted: pesan
            });
            break;
          }

          // Tambahkan user ke daftar banned
          bannedUsers[idChat].push(targetUser);
          saveDB("./lib/database/bannedUsers.json", bannedUsers);

          // Ambil nama target (untuk tampilan)
          let namaTargetBan = targetUser.split("@")[0];
          try {
            const grupMetadata = await socket.groupMetadata(idChat);
            const member = grupMetadata.participants.find(p => p.id === targetUser);
            if (member && member.name) namaTargetBan = member.name;
            else if (member && member.notify) namaTargetBan = member.notify;
          } catch (e) {}

          await socket.sendMessage(idChat, {
            text: `*✅ USER @${namaTargetBan} BERHASIL DI-BAN!* ✅\n\n*🚫 User tidak akan bisa mengirim pesan di grup ini.*\n*📌 Gunakan /unban untuk mencabut ban.*`,
            mentions: [targetUser]
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BAN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal melakukan ban. Coba lagi nanti.*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "unban":
        try {
          // Cek harus di grup
          if (!dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan di grup!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah pengirim admin
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan oleh owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Ambil target user
          let targetUser = null;
          let mentionUnban = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionUnban) {
            targetUser = mentionUnban;
          } else if (args[0]) {
            targetUser = args[0];
            if (!targetUser.includes("@") && !targetUser.includes("@lid")) {
              targetUser = targetUser + "@lid";
            }
          }

          if (!targetUser) {
            await socket.sendMessage(idChat, {
              text: "*❌ TAG USER YANG INGIN DI-UNBAN!*\n\n*📌 Contoh : /unban @user*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah grup punya daftar ban
          if (!bannedUsers[idChat] || bannedUsers[idChat].length === 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ TIDAK ADA USER YANG DI-BAN DI GRUP INI!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah user ter-ban
          if (!bannedUsers[idChat].includes(targetUser)) {
            await socket.sendMessage(idChat, {
              text: `*❌ USER @${targetUser.split("@")[0]} TIDAK SEDANG DI-BAN DI GRUP INI!*`,
              mentions: [targetUser]
            }, {
              quoted: pesan
            });
            break;
          }

          // Hapus user dari daftar banned
          bannedUsers[idChat] = bannedUsers[idChat].filter(id => id !== targetUser);

          // Hapus array jika kosong
          if (bannedUsers[idChat].length === 0) {
            delete bannedUsers[idChat];
          }

          saveDB("./lib/database/bannedUsers.json", bannedUsers);

          // Ambil nama target (untuk tampilan)
          let namaTargetUnban = targetUser.split("@")[0];
          try {
            const grupMetadata = await socket.groupMetadata(idChat);
            const member = grupMetadata.participants.find(p => p.id === targetUser);
            if (member && member.name) namaTargetUnban = member.name;
            else if (member && member.notify) namaTargetUnban = member.notify;
          } catch (e) {}

          await socket.sendMessage(idChat, {
            text: `*✅ USER @${namaTargetUnban} BERHASIL DI-UNBAN!* ✅\n\n*🔓 User sekarang bisa mengirim pesan lagi di grup ini.*`,
            mentions: [targetUser]
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("UNBAN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal melakukan unban. Coba lagi nanti.*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "listban":
        try {
          if (!dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan di grup!*",
            }, {
              quoted: pesan
            });
            break;
          }

          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan oleh owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (bannedList.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📋 DAFTAR USER YANG DI-BAN*\n\n*✅ Tidak ada user yang di-ban di grup ini.*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teksBan = `*📋 DAFTAR USER YANG DI-BAN*\n\n*📊 Total : ${bannedList.length} user*\n\n`;

          for (let i = 0; i < bannedList.length; i++) {
            let userId = bannedList[i];
            let namaUser = userId.split("@")[0];

            // Coba ambil nama dari grup
            try {
              const grupMetadata = await socket.groupMetadata(idChat);
              const member = grupMetadata.participants.find(p => p.id === userId);
              if (member && member.name) namaUser = member.name;
              else if (member && member.notify) namaUser = member.notify;
            } catch (e) {}

            teksBan += `${i + 1}. @${namaUser}\n`;
          }

          teksBan += `\n*📌 Gunakan /unban @user untuk mencabut ban.*`;

          await socket.sendMessage(idChat, {
            text: teksBan,
            mentions: bannedList
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("LISTBAN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal menampilkan daftar ban.*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "kudeta":
        try {
          // Hanya owner bot yang bisa
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Harus dari chat pribadi, bukan grup
          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan di chat pribadi bot!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /kudeta [ID Grup]*\n*📌 /kudeta [ID Grup] confirm*\n\n*Cek ID grup dengan /listgc*"
            }, {
              quoted: pesan
            });
            break;
          }

          let targetGroup = args[0];
          let isConfirm = args[1] && args[1].toLowerCase() === "confirm";

          // Validasi ID grup
          if (!targetGroup.includes("@g.us")) {
            targetGroup = targetGroup + "@g.us";
          }

          // Cek apakah bot berada di grup tersebut
          const groups = await socket.groupFetchAllParticipating();
          if (!groups[targetGroup]) {
            await socket.sendMessage(idChat, {
              text: `*❌ Bot tidak berada di grup dengan ID: ${targetGroup}!*\n\n*Gunakan /listgc untuk melihat grup yang tersedia.*`
            }, {
              quoted: pesan
            });
            break;
          }

          const groupMetadata = await socket.groupMetadata(targetGroup);
          const groupName = groupMetadata.subject;
          const currentOwner = groupMetadata.owner;

          if (!isConfirm) {
            await socket.sendMessage(idChat, {
              text: `*⚠️ PERINGATAN KUDETA!* ⚠️\n\n*📱 Grup: ${groupName}*\n*🆔 ID: ${targetGroup}*\n*👑 Owner saat ini: ${currentOwner || "Tidak diketahui"}*\n\n*📌 Ketik /kudeta ${targetGroup} confirm untuk melanjutkan.*\n\n*⚠️ Tindakan ini tidak bisa dibatalkan!*\n*⚠️ Owner asli akan DIKELUARKAN dari grup!*`
            }, {
              quoted: pesan
            });
            break;
          }

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          kudetaData[targetGroup] = {
            status: "takeover",
            newOwner: nomorPengirim,
            oldOwner: currentOwner || "Unknown",
            groupName: groupName,
            timestamp: Date.now()
          };

          saveDB("./lib/database/kudeta.json", kudetaData);

          // === EFEK KUDETA DI GRUP ===

          // 1. Keluarkan owner asli dari grup
          if (currentOwner) {
            try {
              await socket.groupParticipantsUpdate(targetGroup, [currentOwner], "remove");
              console.log(`✅ Berhasil mengeluarkan owner asli: ${currentOwner}`);
            } catch (e) {
              console.log("Gagal mengeluarkan owner:", e);
            }
          }

          // 2. Ganti nama grup
          let newGroupName = `[KUDETA] ${groupName}`;
          try {
            await socket.groupUpdateSubject(targetGroup, newGroupName);
          } catch (e) {
            console.log("Gagal ganti nama grup:", e);
          }

          // 3. Kirim notifikasi ke owner lama (opsional, meskipun sudah dikeluarkan)
          if (currentOwner) {
            await socket.sendMessage(currentOwner, {
              text: `⚠️ *ANDA TELAH DIKUDETA!* ⚠️\n\n*Grup: ${groupName}*\n*Anda telah dikeluarkan oleh @${nomorPengirim}*\n*Waktu: ${new Date().toLocaleString("id-ID")}*\n\n*Anda tidak dapat mengakses grup tersebut lagi.*`,
              mentions: [pengirim]
            }).catch(() => {});
          }

          await socket.sendMessage(idChat, {
            text: `*✅ KUDETA BERHASIL!* ✅\n\n*📱 Grup: ${groupName}*\n*🆔 ID: ${targetGroup}*\n*👑 Pemilik baru: ${nomorPengirim}*\n*🚫 Pemilik asli: ${currentOwner || "Unknown"} (telah dikeluarkan)*\n\n*📌 Gunakan /resetgrup ${targetGroup} untuk mengembalikan grup ke normal (owner asli tidak bisa otomatis masuk kembali).*`
          }, {
            quoted: pesan
          });

          await socket.sendMessage(idChat, {
            react: {
              text: '✅', key: pesan.key
            }
          });

        } catch (err) {
          console.log("KUDETA ERROR:", err);
          await socket.sendMessage(idChat, {
            text: `*❌ GAGAL KUDETA!*\n\n*Error: ${err.message}*\n\n*Pastikan bot adalah admin di grup tersebut.*`
          }, {
            quoted: pesan
          });
        }
        break;

      case "resetgrup":
        try {
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan di chat pribadi bot!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /resetgrup [ID Grup]*\n\n*Cek ID grup dengan /listgc*"
            }, {
              quoted: pesan
            });
            break;
          }

          let targetGroup = args[0];
          if (!targetGroup.includes("@g.us")) {
            targetGroup = targetGroup + "@g.us";
          }

          if (!kudetaData[targetGroup]) {
            await socket.sendMessage(idChat, {
              text: `*❌ Grup dengan ID ${targetGroup} tidak dalam status kudeta!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let groupData = kudetaData[targetGroup];
          let originalName = groupData.groupName;

          // Kembalikan nama grup
          try {
            await socket.groupUpdateSubject(targetGroup, originalName);
          } catch (e) {}

          // Kirim pesan ke grup
          try {
            await socket.sendMessage(targetGroup, {
              text: `*✅ GRUP KEMBALI NORMAL!* ✅\n\n*Grup ini telah dikembalikan ke pemilik asli.*\n*Status kudeta dicabut.*\n\n*📌 Pemilik asli perlu ditambahkan kembali secara manual jika ingin bergabung.*`
            });
          } catch (e) {}

          delete kudetaData[targetGroup];
          saveDB("./lib/database/kudeta.json", kudetaData);

          await socket.sendMessage(idChat, {
            text: `*✅ GRUP BERHASIL DI-RESET!* ✅\n\n*📱 Grup: ${originalName}*\n*🆔 ID: ${targetGroup}*\n\n*Grup kembali normal.*\n*⚠️ Pemilik asli tidak otomatis masuk, perlu ditambahkan manual.*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("RESETGRUP ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal reset grup!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "bubargc":
        try {
          // Hanya owner bot yang bisa menggunakan fitur ini
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ AKSES DITOLAK!*\n\n*Hanya owner bot yang bisa membubarkan grup.*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah pakai ID grup (remote) atau langsung di grup
          let targetGroup = null;
          let isRemote = false;
          let groupMetadataTarget = null;
          let botJidTarget = botId;

          // Jika args[0] adalah ID grup (remote mode)
          if (args[0] && args[0].includes("@g.us")) {
            targetGroup = args[0];
            isRemote = true;

            // Cek apakah bot berada di grup tersebut
            const groups = await socket.groupFetchAllParticipating();
            if (!groups[targetGroup]) {
              await socket.sendMessage(idChat, {
                text: `*❌ Bot tidak berada di grup dengan ID: ${targetGroup}!*\n\n*Gunakan /listgc untuk melihat grup yang tersedia*`
              }, {
                quoted: pesan
              });
              break;
            }

            groupMetadataTarget = await socket.groupMetadata(targetGroup);

            // 🔧 FIX: Validasi groupMetadataTarget dan participants
            if (!groupMetadataTarget || !groupMetadataTarget.participants) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gagal mendapatkan data grup!*\n\n*Pastikan ID grup valid dan bot masih berada di grup tersebut.*`
              }, {
                quoted: pesan
              });
              break;
            }

            // Konfirmasi untuk remote
            if (!args[1] || args[1].toLowerCase() !== "confirm") {
              let memberCount = groupMetadataTarget.participants?.length || 0;
              let ownerGrupId = groupMetadataTarget.owner;
              let ownerBotId = ownerLid;

              let akanDikeluarkan = groupMetadataTarget.participants?.filter(p => {
                return p.id !== ownerGrupId && p.id !== ownerBotId && p.id !== botJidTarget;
              }).length || 0;

              await socket.sendMessage(idChat, {
                text: `*💥 PERINGATAN BUBARKAN GRUP (REMOTE)!* 💥\n\n*📱 Grup : ${groupMetadataTarget.subject || "Tidak diketahui"}*\n*🆔 ID : ${targetGroup}*\n*👥 Total member : ${memberCount} orang*\n*👑 Owner grup : @${ownerGrupId?.split("@")[0] || "Unknown"}*\n*🤖 Owner bot : @${ownerBotId?.split("@")[0]}*\n*📊 Akan dikeluarkan : ${akanDikeluarkan} orang*\n*✅ Yang tetap : Owner grup, Owner bot, dan Bot*\n\n*⚠️ TINDAKAN INI AKAN MENGELUARKAN SEMUA MEMBER LAINNYA!*\n\n*📌 Ketik /bubargc ${targetGroup} confirm untuk melanjutkan.*\n\n*⚠️ Tindakan ini tidak bisa dibatalkan!*`,
                mentions: [ownerGrupId, ownerBotId].filter(id => id)
              }, {
                quoted: pesan
              });
              break;
            }

            // Eksekusi remote bubar
            await socket.sendMessage(idChat, {
              react: {
                text: '🕐', key: pesan.key
              }
            });

            let allParticipants = groupMetadataTarget.participants || [];
            let kickedCount = 0;
            let failedCount = 0;
            let ownerGrupId = groupMetadataTarget.owner;
            let ownerBotId = ownerLid;

            let targetsToKick = allParticipants.filter(p => {
              return p.id !== ownerGrupId && p.id !== ownerBotId && p.id !== botJidTarget;
            }).map(p => p.id);

            if (targetsToKick.length === 0) {
              await socket.sendMessage(idChat, {
                text: "*⚠️ TIDAK ADA MEMBER YANG BISA DIKELUARKAN!*\n\n*Mungkin hanya ada owner grup, owner bot, dan bot di grup ini.*"
              }, {
                quoted: pesan
              });
              break;
            }

            // Eksekusi kick bertahap
            let batchSize = 5;
            for (let i = 0; i < targetsToKick.length; i += batchSize) {
              let batch = targetsToKick.slice(i, i + batchSize);
              try {
                await socket.groupParticipantsUpdate(targetGroup, batch, "remove");
                kickedCount += batch.length;
              } catch (err) {
                failedCount += batch.length;
              }
              await delay(2000);
            }

            // Ganti nama grup
            let newGroupName = `[BUBAR] ${groupMetadataTarget.subject || "Grup"}`;
            try {
              await socket.groupUpdateSubject(targetGroup, newGroupName);
            } catch (e) {}

            // Update deskripsi grup
            try {
              await socket.groupUpdateDescription(targetGroup, `🚫 GRUP TELAH DIBUBARKAN 🚫\n\n📅 Tanggal : ${new Date().toLocaleString("id-ID")}\n👑 Dibubarkan oleh : @${nomorPengirim}\n📊 Total member dikeluarkan : ${kickedCount}\n\n❌ Grup ini tidak dapat digunakan lagi.`);
            } catch (e) {}

            // Laporan ke owner bot
            await socket.sendMessage(pengirim, {
              text: `*📋 LAPORAN BUBAR GRUP (REMOTE)* 📋\n\n*📱 Grup : ${groupMetadataTarget.subject || "Tidak diketahui"}*\n*🆔 ID : ${targetGroup}*\n*✅ Berhasil dikeluarkan : ${kickedCount} member*\n*❌ Gagal : ${failedCount} member*\n*👑 Owner grup : ${ownerGrupId?.split("@")[0] || "Unknown"}* (tetap)\n*🤖 Owner bot : ${ownerBotId?.split("@")[0]}* (tetap)\n*📅 Waktu : ${new Date().toLocaleString("id-ID")}*\n\n*💥 Grup telah dibubarkan!*`
            });

            await socket.sendMessage(idChat, {
              text: `*✅ GRUP BERHASIL DIBUBARKAN (REMOTE)!* ✅\n\n*📱 Grup : ${groupMetadataTarget.subject || "Tidak diketahui"}*\n*🆔 ID : ${targetGroup}*\n*📊 Total member dikeluarkan : ${kickedCount}*\n*👑 Owner grup tetap*\n*🤖 Owner bot tetap*\n\n*💥 Grup telah dibubarkan dari jarak jauh!*`,
              react: {
                text: '✅', key: pesan.key
              }
            }, {
              quoted: pesan
            });

            break;
          }

          // ========== MODE LANGSUNG (DI GRUP) ==========

          // Konfirmasi
          if (!args[0] || args[0].toLowerCase() !== "confirm") {
            let memberCount = metadata?.participants?.length || 0;
            let ownerGrupId = metadata?.owner;
            let ownerBotId = ownerLid;

            await socket.sendMessage(idChat, {
              text: `*💥 PERINGATAN BUBARKAN GRUP!* 💥\n\n*📱 Grup : ${metadata?.subject || "Tidak diketahui"}*\n*👥 Total member : ${memberCount} orang*\n*👑 Owner grup: @${ownerGrupId?.split("@")[0] || "Unknown"}*\n*🤖 Owner bot : @${ownerBotId?.split("@")[0]}*\n*✅ Yang tetap : Owner grup, Owner bot, dan Bot*\n\n*⚠️ TINDAKAN INI AKAN MENGELUARKAN SEMUA MEMBER LAINNYA!*\n\n*📌 Ketik /bubargc confirm untuk melanjutkan.*\n\n*⚠️ Tindakan ini tidak bisa dibatalkan!*`,
              mentions: [ownerGrupId, ownerBotId].filter(id => id)
            }, {
              quoted: pesan
            });
            break;
          }

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          let allParticipants = metadata?.participants || [];
          let kickedCount = 0;
          let failedCount = 0;
          let ownerGrupId = metadata?.owner;
          let ownerBotId = ownerLid;
          let botJid = botId;

          let targetsToKick = allParticipants.filter(p => {
            return p.id !== ownerGrupId && p.id !== ownerBotId && p.id !== botJid;
          }).map(p => p.id);

          if (targetsToKick.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*⚠️ TIDAK ADA MEMBER YANG BISA DIKELUARKAN!*\n\n*Mungkin hanya ada owner grup, owner bot, dan bot di grup ini.*"
            }, {
              quoted: pesan
            });
            break;
          }

          await socket.sendMessage(idChat, {
            text: `💥 *GRUP AKAN DIBUBARKAN!* 💥\n\n*📊 ${targetsToKick.length} member akan dikeluarkan...*\n*✅ Owner grup dan owner bot akan tetap berada di grup.*\n\n*Selamat tinggal semuanya! 👋*`,
            mentions: targetsToKick.slice(0, 10)
          });

          let batchSize = 5;
          for (let i = 0; i < targetsToKick.length; i += batchSize) {
            let batch = targetsToKick.slice(i, i + batchSize);
            try {
              await socket.groupParticipantsUpdate(idChat, batch, "remove");
              kickedCount += batch.length;
            } catch (err) {
              failedCount += batch.length;
            }
            await delay(2000);
          }

          let newGroupName = `[BUBAR] ${metadata?.subject || "Grup"}`;
          try {
            await socket.groupUpdateSubject(idChat, newGroupName);
          } catch (e) {}

          try {
            await socket.groupUpdateDescription(idChat, `🚫 GRUP TELAH DIBUBARKAN 🚫\n\n📅 Tanggal : ${new Date().toLocaleString("id-ID")}\n👑 Dibubarkan oleh : @${nomorPengirim}\n📊 Total member dikeluarkan : ${kickedCount}\n\n❌ Grup ini tidak dapat digunakan lagi.`);
          } catch (e) {}

          await socket.sendMessage(pengirim, {
            text: `*📋 LAPORAN BUBAR GRUP* 📋\n\n*📱 Grup : ${metadata?.subject || "Tidak diketahui"}*\n*🆔 ID: ${idChat}*\n*✅ Berhasil dikeluarkan : ${kickedCount} member*\n*❌ Gagal: ${failedCount} member*\n*👑 Owner grup : ${ownerGrupId?.split("@")[0] || "Unknown"}* (tetap)\n*🤖 Owner bot : ${ownerBotId?.split("@")[0]}* (tetap)\n*📅 Waktu : ${new Date().toLocaleString("id-ID")}*\n\n*💥 Grup telah dibubarkan!*`
          });

          await socket.sendMessage(idChat, {
            text: `*✅ GRUP BERHASIL DIBUBARKAN!* ✅\n\n*📊 Total member dikeluarkan : ${kickedCount}*\n*👑 Owner grup : @${ownerGrupId?.split("@")[0] || "Unknown"} (tetap)*\n*🤖 Owner bot : @${ownerBotId?.split("@")[0]} (tetap)*\n*🤖 Bot : tetap*\n\n*💥 Grup sekarang hanya berisi owner grup, owner bot, dan bot.*\n*📌 Grup ini telah dibubarkan dan tidak dapat digunakan lagi.*`,
            mentions: [ownerGrupId, ownerBotId].filter(id => id)
          }, {
            quoted: pesan
          });

          await socket.sendMessage(idChat, {
            react: {
              text: '✅', key: pesan.key
            }
          });

        } catch (err) {
          console.log("BUBARGC ERROR:", err);
          await socket.sendMessage(idChat, {
            text: `*❌ GAGAL MEMBUBARKAN GRUP!*\n\n*Error: ${err.message}*\n\n*Pastikan bot adalah admin grup.*`
          }, {
            quoted: pesan
          });
        }
        break;

      case "infogc":
        if (dariGrup && !pengirimAdmin) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus admin!*"
          }, {
            quoted: pesan
          })
        }
        if (!dariGrup && !isOwner) {
          await socket.sendMessage(idChat, {
            text: "*Command khusus owner!*"
          }, {
            quoted: pesan
          })
        }
        try {
          let targetGroup = null;
          let groupMetadataTarget = null;
          let isRemote = false;

          // Cek apakah pakai ID grup (remote mode)
          if (args[0] && args[0].includes("@g.us")) {
            targetGroup = args[0];
            isRemote = true;

            // Cek apakah bot berada di grup tersebut
            const groups = await socket.groupFetchAllParticipating();
            if (!groups[targetGroup]) {
              await socket.sendMessage(idChat, {
                text: `*❌ Bot tidak berada di grup dengan ID: ${targetGroup}!*\n\n*Gunakan /listgc untuk melihat grup yang tersedia.*`,
                contextInfo: {
                  externalAdReply: {
                    title: "📋 INFO GRUP",
                    body: "Group Not Found",
                    thumbnailUrl: randomThumb(),
                    sourceUrl: "https://whatsapp.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              }, {
                quoted: pesan
              });
              break;
            }

            groupMetadataTarget = await socket.groupMetadata(targetGroup);

            if (!groupMetadataTarget) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gagal mendapatkan data grup!*\n\n*Pastikan ID grup valid.*`
              }, {
                quoted: pesan
              });
              break;
            }
          } else {
            // Mode langsung (di grup)
            if (!dariGrup) {
              await socket.sendMessage(idChat, {
                text: "*❌ Command ini hanya bisa digunakan di grup!*\n\n*Atau gunakan /infogc [ID Grup] untuk cek dari jarak jauh.*"
              }, {
                quoted: pesan
              });
              break;
            }
            targetGroup = idChat;
            groupMetadataTarget = metadata;
          }

          // Validasi participants
          if (!groupMetadataTarget.participants) {
            await socket.sendMessage(idChat, {
              text: "*❌ Gagal mendapatkan data peserta grup!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== HITUNG DATA =====================
          let participants = groupMetadataTarget.participants;
          let totalMembers = participants.length;
          let totalAdmins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin").length;
          let ownerId = groupMetadataTarget.owner;
          let groupName = groupMetadataTarget.subject || "Tanpa Nama";
          let groupDesc = groupMetadataTarget.desc || "Tidak ada deskripsi";
          let groupCreated = groupMetadataTarget.creation ? new Date(groupMetadataTarget.creation * 1000).toLocaleString("id-ID"): "Tidak diketahui";
          let groupId = targetGroup;

          // Cek apakah bot admin di grup
          let isBotAdmin = participants.some(p => p.id === botId && (p.admin === "admin" || p.admin === "superadmin"));

          // Hitung member online (tidak selalu akurat)
          let onlineCount = "Tidak tersedia";
          try {
            let presence = await socket.presenceSubscribe(targetGroup);
            onlineCount = "Tidak bisa dideteksi";
          } catch (e) {}

          // Cek status premium grup
          let isPremium = isPremiumGroup(targetGroup);
          let premiumStatus = isPremium ? "✅ Premium": "❌ Free";

          // Cek status kudeta (jika ada)
          let kudetaData = loadDB("./lib/database/kudeta.json") || {};
          let isKudeta = kudetaData[targetGroup] ? true: false;
          let kudetaStatus = isKudeta ? "🔥 STATUS KUDETA": "✅ Normal";

          // ===================== BUILD TEKS =====================
          let modeText = isRemote ? "(REMOTE)": "";
          let teks = `*📋 INFO GRUP ${modeText}* 📋\n\n`;
          teks += `*📱 Nama :* ${groupName}\n`;
          teks += `*🆔 ID :* \`${groupId}\`\n`;
          teks += `*📝 Deskripsi :*\n_${groupDesc.substring(0, 100)}${groupDesc.length > 100 ? "...": ""}_\n\n`;
          teks += `*👥 Member :* ${totalMembers} orang\n`;
          teks += `*👑 Admin :* ${totalAdmins} orang\n`;
          teks += `*🤖 Bot Admin :* ${isBotAdmin ? "✅ Ya": "❌ Tidak"}\n`;
          teks += `*👑 Owner :* @${ownerId?.split("@")[0] || "Unknown"}\n`;
          teks += `*📅 Dibuat :* ${groupCreated}\n`;
          teks += `*💎 Status :* ${premiumStatus}\n`;
          teks += `*⚡ Status Grup :* ${kudetaStatus}\n\n`;

          // Tambahan info jika remote
          if (isRemote) {
            teks += `*📌 Cara join :* Klik link undangan (jika ada)\n`;
            teks += `*📌 Kode undangan :* Tidak bisa didapat melalui API\n`;
          }

          teks += `\n*📌 Gunakan /listgc untuk melihat semua grup.*`;

          // Kirim pesan dengan mention owner
          await socket.sendMessage(idChat, {
            text: teks,
            mentions: [ownerId].filter(id => id)
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("INFOGCE ERROR:", err);
          await socket.sendMessage(idChat, {
            text: `*❌ GAGAL MENGAMBIL INFO GRUP!*\n\n*Error: ${err.message}*\n\n*Pastikan ID grup valid dan bot masih berada di grup tersebut.*`
          }, {
            quoted: pesan
          });
        }
        break;

      case "village":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let v = globalVillages[username];

          if (!v) {
            // Buat desa baru
            globalVillages[username] = {
              name: `Desa ${users[pengirim].displayName}`,
              townHall: 1,
              buildings: {
                goldMine: {
                  level: 1,
                  lastCollected: Date.now()
                },
                elixirCollector: {
                  level: 1,
                  lastCollected: Date.now()
                }
              },
              resources: {
                gold: 5000,
                elixir: 5000,
                darkElixir: 0
              },
              troops: {
                barbarian: 10,
                archer: 5
              },
              shield: 0,
              trophies: 1000
            };
            v = globalVillages[username];
            saveDB("./lib/database/globalVillages.json", globalVillages);
          }

          let defensePower = getDefensePower(v);
          let attackPower = getAttackPower(v.troops);
          let totalTroops = getTroopCount(v.troops);
          let shieldLeft = v.shield > Date.now() ? Math.ceil((v.shield - Date.now()) / 3600000): 0;

          let teks = `🏰 *${v.name} - Town Hall ${v.townHall}* 🏰\n\n`;
          teks += `*💰 RESOURCES:*\n`;
          teks += `🪙 Emas: ${v.resources.gold.toLocaleString()}\n`;
          teks += `🧪 Elixir: ${v.resources.elixir.toLocaleString()}\n`;
          teks += `💎 Dark Elixir: ${v.resources.darkElixir.toLocaleString()}\n`;
          teks += `🏆 Trophies: ${v.trophies}\n\n`;

          teks += `*🏗️ BANGUNAN:*\n`;
          teks += `• Town Hall lv.${v.townHall}\n`;
          if (v.buildings.goldMine) teks += `• Gold Mine lv.${v.buildings.goldMine.level}\n`;
          if (v.buildings.elixirCollector) teks += `• Elixir Collector lv.${v.buildings.elixirCollector.level}\n`;
          if (v.buildings.cannon) teks += `• Cannon lv.${v.buildings.cannon.level}\n`;
          if (v.buildings.archerTower) teks += `• Archer Tower lv.${v.buildings.archerTower.level}\n`;
          if (v.buildings.mortar) teks += `• Mortar lv.${v.buildings.mortar.level}\n`;
          if (v.buildings.wizardTower) teks += `• Wizard Tower lv.${v.buildings.wizardTower.level}\n`;
          teks += `🛡️ Total Defense: ${defensePower}\n\n`;

          teks += `*⚔️ TROOPS:*\n`;
          teks += `• Barbarian: ${v.troops.barbarian || 0}\n`;
          teks += `• Archer: ${v.troops.archer || 0}\n`;
          teks += `• Giant: ${v.troops.giant || 0}\n`;
          teks += `• Goblin: ${v.troops.goblin || 0}\n`;
          teks += `• Wall Breaker: ${v.troops.wallBreaker || 0}\n`;
          teks += `• Balloon: ${v.troops.balloon || 0}\n`;
          teks += `• Wizard: ${v.troops.wizard || 0}\n`;
          teks += `⚡ Total Attack: ${attackPower} (${totalTroops} unit)\n\n`;

          if (shieldLeft > 0) {
            teks += `*🛡️ Shield: ${shieldLeft} jam lagi*\n`;
          } else {
            teks += `*🛡️ Shield: Tidak aktif*\n`;
          }

          teks += `\n*📌 COMMAND:*\n`;
          teks += `/build [nama] - Upgrade bangunan\n`;
          teks += `/train [unit] [jumlah] - Latih pasukan\n`;
          teks += `/collect - Kumpulkan resource\n`;
          teks += `/attack - Cari musuh\n`;
          teks += `/attack @user - Serang langsung`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("VILLAGE ERROR:", err);
        }
        break;

      case "leaderboard":
        try {
          let sorted = Object.entries(villages)
          .filter(([_, v]) => v && v.trophies !== undefined)
          .sort((a, b) => b[1].trophies - a[1].trophies)
          .slice(0, 10);

          if (sorted.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*🏆 Belum ada player!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*🏆 LEADERBOARD CLASH OF CLANS* 🏆\n\n`;
          let medals = ["🥇",
            "🥈",
            "🥉",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟"];

          for (let i = 0; i < sorted.length; i++) {
            let [userId,
              v] = sorted[i];
            let name = v.name || userId.split("@")[0];
            teks += `${medals[i]} *${name}*\n`;
            teks += `   🏆 ${v.trophies} trophies | 🏰 TH ${v.townHall}\n\n`;
          }

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });
        } catch (err) {
          console.log("LEADERBOARD ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil leaderboard!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "coc":
        try {
          await socket.sendMessage(idChat, {
            text: `*CLASH OF CLANS WHATSAPP EDITION*\n\n*Command play the game :*\n- *${prefix}village - cek desa sendiri*\n- *${prefix}build - bangun desa*\n- *${prefix}collect - claim resource*\n- *${prefix}attack - cari desa dan serang*\n- *${prefix}train - latihan*\n- *${prefix}leaderboard*`
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Error : ", err)
        }
        break;
      case "claimsaldo":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          const claimAmount = 50000;
          const cooldown = 24 * 60 * 60 * 1000;

          if (globalClaimCooldown[username] && (Date.now() - globalClaimCooldown[username]) < cooldown) {
            const remaining = Math.ceil((cooldown - (Date.now() - globalClaimCooldown[username])) / (60 * 60 * 1000));
            await socket.sendMessage(idChat, {
              text: `*❌ SUDAH PERNAH KLAIM!*\n\n*⏰ Tunggu ${remaining} jam lagi untuk klaim berikutnya.*`
            }, {
              quoted: pesan
            });
            break;
          }

          globalSaldo[username] = (globalSaldo[username] || 0) + claimAmount;
          globalClaimCooldown[username] = Date.now();

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalClaimCooldown.json", globalClaimCooldown);

          await socket.sendMessage(idChat, {
            text: `*✅ CLAIM SALDO BERHASIL!*\n\n*💰 +${claimAmount.toLocaleString()} ke saldo Anda!*\n*💳 Saldo sekarang : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n*⏰ Claim berikutnya: 24 jam lagi*\n*🎰 Gunakan /slot untuk bermain!*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CLAIMSALDO ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal claim saldo!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "collect":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!globalVillages[username]) {
            await socket.sendMessage(idChat, {
              text: "*🏰 Buat desa dulu dengan /village!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let v = globalVillages[username];
          let now = Date.now();
          let collected = {
            gold: 0,
            elixir: 0
          };

          if (v.buildings.goldMine) {
            let mine = v.buildings.goldMine;
            let prodData = buildingsData.goldMine[mine.level];
            if (prodData) {
              let elapsed = now - (mine.lastCollected || now);
              let earned = Math.floor(elapsed / 60000) * prodData.production;
              if (earned > 0) {
                collected.gold = earned;
                v.resources.gold += earned;
                mine.lastCollected = now;
              }
            }
          }

          if (v.buildings.elixirCollector) {
            let collector = v.buildings.elixirCollector;
            let prodData = buildingsData.elixirCollector[collector.level];
            if (prodData) {
              let elapsed = now - (collector.lastCollected || now);
              let earned = Math.floor(elapsed / 60000) * prodData.production;
              if (earned > 0) {
                collected.elixir = earned;
                v.resources.elixir += earned;
                collector.lastCollected = now;
              }
            }
          }

          saveDB("./lib/database/globalVillages.json", globalVillages);

          await socket.sendMessage(idChat, {
            text: `*💰 COLLECT RESOURCE!*\n\n*🪙 +${collected.gold.toLocaleString()} Emas*\n*🧪 +${collected.elixir.toLocaleString()} Elixir*\n\n*💎 Total Emas : ${v.resources.gold.toLocaleString()}*\n*🧪 Total Elixir : ${v.resources.elixir.toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("COLLECT ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal collect!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "train":
        try {
          // Cek login dulu
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          // Cek apakah punya desa
          if (!globalVillages[username]) {
            await socket.sendMessage(idChat, {
              text: "*🏰 Buat desa dulu dengan /village!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek argumen
          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: `*⚔️ DAFTAR TROOPS:*\n\n` +
              `• barbarian (${troopsData.barbarian?.cost || 80} elixir)\n` +
              `• archer (${troopsData.archer?.cost || 100} elixir)\n` +
              `• giant (${troopsData.giant?.cost || 500} elixir)\n` +
              `• goblin (${troopsData.goblin?.cost || 60} elixir)\n` +
              `• wallBreaker (${troopsData.wallBreaker?.cost || 1000} elixir)\n` +
              `• balloon (${troopsData.balloon?.cost || 2000} elixir)\n` +
              `• wizard (${troopsData.wizard?.cost || 2500} elixir)\n\n` +
              `📌 Contoh: /train barbarian 20`
            }, {
              quoted: pesan
            });
            break;
          }

          let unit = args[0].toLowerCase();
          let qty = parseInt(args[1]);
          let v = globalVillages[username];

          // Validasi qty
          if (isNaN(qty) || qty <= 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Jumlah harus lebih dari 0!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek unit ada di database
          if (!troopsData[unit]) {
            await socket.sendMessage(idChat, {
              text: `*❌ Unit "${unit}" tidak dikenal!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek unlock Town Hall
          if (troopsData[unit].unlockTH > v.townHall) {
            await socket.sendMessage(idChat, {
              text: `*❌ ${unit} baru unlock di Town Hall ${troopsData[unit].unlockTH}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let totalCost = troopsData[unit].cost * qty;

          // Cek elixir cukup
          if (v.resources.elixir < totalCost) {
            await socket.sendMessage(idChat, {
              text: `*❌ Elixir kurang! Butuh ${totalCost.toLocaleString()} elixir*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Proses training
          v.resources.elixir -= totalCost;
          if (!v.troops[unit]) v.troops[unit] = 0;
          v.troops[unit] += qty;

          saveDB("./lib/database/globalVillages.json", globalVillages);

          await socket.sendMessage(idChat, {
            text: `*⚔️ TRAINING BERHASIL!* ⚔️\n\n*🎖️ Unit:* ${unit}\n*📦 Jumlah:* ${qty} pasukan\n*💰 Biaya:* ${totalCost.toLocaleString()} elixir\n*💪 Total ${unit}:* ${v.troops[unit]}\n*🧪 Sisa elixir:* ${v.resources.elixir.toLocaleString()}`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TRAIN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal latih pasukan!*\n\n*Error: " + err.message
          }, {
            quoted: pesan
          });
        }
        break;

      case "build":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!globalVillages[username]) {
            await socket.sendMessage(idChat, {
              text: "*🏰 Buat desa dulu dengan /village!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let v = globalVillages[username];

          // Tampilkan daftar bangunan jika tanpa argumen
          if (!args[0]) {
            let teks = `*🏗️ DAFTAR BANGUNAN* 🏗️\n\n`;
            teks += `*📊 STATS DESA :*\n`;
            teks += `*💰 Gold :* ${v.resources.gold.toLocaleString()}\n`;
            teks += `*🧪 Elixir :* ${v.resources.elixir.toLocaleString()}\n`;
            teks += `*🏰 Town Hall :* ${v.townHall}\n\n`;
            teks += `*🔧 BANGUNAN YANG TERSEDIA :*\n\n`;

            // Town Hall
            let nextTH = buildingsData.townHall?.[v.townHall + 1];
            teks += `*• townhall* - Upgrade ke level ${v.townHall + 1}`;
            if (nextTH) {
              teks += ` (${nextTH.cost.toLocaleString()} gold)`;
            } else {
              teks += ` (MAX)`;
            }
            teks += `\n`;
            if (nextTH?.unlock) teks += `   *✨ Membuka :* ${nextTH.unlock.join(", ")}\n`;

            // Gold Mine
            let nextGM = buildingsData.goldMine?.[(v.buildings.goldMine?.level || 0) + 1];
            teks += `\n*• goldMine* - Upgrade ke level ${(v.buildings.goldMine?.level || 0) + 1}`;
            if (nextGM) {
              teks += ` (${nextGM.cost.toLocaleString()} gold) | *Produksi :* ${nextGM.production}/menit`;
            } else {
              teks += ` (MAX)`;
            }
            teks += `\n`;

            // Elixir Collector
            let nextEC = buildingsData.elixirCollector?.[(v.buildings.elixirCollector?.level || 0) + 1];
            teks += `\n*• elixirCollector* - Upgrade ke level ${(v.buildings.elixirCollector?.level || 0) + 1}`;
            if (nextEC) {
              teks += ` (${nextEC.cost.toLocaleString()} gold) | *Produksi :* ${nextEC.production}/menit`;
            } else {
              teks += ` (MAX)`;
            }
            teks += `\n`;

            // Cannon
            if (v.buildings.cannon) {
              let nextCannon = buildingsData.cannon?.[v.buildings.cannon.level + 1];
              teks += `\n*• cannon* - Upgrade ke level ${v.buildings.cannon.level + 1}`;
              if (nextCannon) {
                teks += ` (${nextCannon.cost.toLocaleString()} gold) | *Attack :* ${nextCannon.attack}`;
              } else {
                teks += ` (MAX)`;
              }
              teks += `\n`;
            } else if (buildingsData.townHall?.[v.townHall]?.unlock?.includes("cannon")) {
              teks += `\n*• cannon* - *🔒 Belum dibangun (gratis, ketik /build cannon)*\n`;
            }

            // Archer Tower
            if (v.buildings.archerTower) {
              let nextAT = buildingsData.archerTower?.[v.buildings.archerTower.level + 1];
              teks += `\n*• archerTower* - Upgrade ke level ${v.buildings.archerTower.level + 1}`;
              if (nextAT) {
                teks += ` (${nextAT.cost.toLocaleString()} gold) | *Attack :* ${nextAT.attack}`;
              } else {
                teks += ` (MAX)`;
              }
              teks += `\n`;
            } else if (buildingsData.townHall?.[v.townHall]?.unlock?.includes("archerTower")) {
              teks += `\n*• archerTower* - *🔒 Belum dibangun (gratis, ketik /build archerTower)*\n`;
            }

            // Mortar
            if (v.buildings.mortar) {
              let nextMortar = buildingsData.mortar?.[v.buildings.mortar.level + 1];
              teks += `\n*• mortar* - Upgrade ke level ${v.buildings.mortar.level + 1}`;
              if (nextMortar) {
                teks += ` (${nextMortar.cost.toLocaleString()} gold) | *Attack :* ${nextMortar.attack}`;
              } else {
                teks += ` (MAX)`;
              }
              teks += `\n`;
            } else if (buildingsData.townHall?.[v.townHall]?.unlock?.includes("mortar")) {
              teks += `\n*• mortar* - *🔒 Belum dibangun (gratis, ketik /build mortar)*\n`;
            }

            // Wizard Tower
            if (v.buildings.wizardTower) {
              let nextWT = buildingsData.wizardTower?.[v.buildings.wizardTower.level + 1];
              teks += `\n*• wizardTower* - Upgrade ke level ${v.buildings.wizardTower.level + 1}`;
              if (nextWT) {
                teks += ` (${nextWT.cost.toLocaleString()} gold) | *Attack :* ${nextWT.attack}`;
              } else {
                teks += ` (MAX)`;
              }
              teks += `\n`;
            } else if (buildingsData.townHall?.[v.townHall]?.unlock?.includes("wizardTower")) {
              teks += `\n*• wizardTower* - *🔒 Belum dibangun (gratis, ketik /build wizardTower)*\n`;
            }

            teks += `\n*📌 Contoh :* /build goldMine\n`;
            teks += `*📌 Upgrade townhall untuk membuka bangunan baru!*`;

            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            });
            break;
          }

          let building = args[0].toLowerCase();
          let currentLevel = 0;
          let buildingData = null;
          let isNewBuilding = false;

          // ===================== TOWN HALL =====================
          if (building === "townhall" || building === "th") {
            currentLevel = v.townHall;
            buildingData = buildingsData.townHall?.[currentLevel + 1];

            if (!buildingData) {
              await socket.sendMessage(idChat, {
                text: "*🏰 Town Hall sudah MAX! Tidak bisa upgrade lagi.*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (v.resources.gold < buildingData.cost) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gold kurang! Butuh ${buildingData.cost.toLocaleString()} gold*`
              }, {
                quoted: pesan
              });
              break;
            }

            v.resources.gold -= buildingData.cost;
            v.townHall++;

            if (buildingData.unlock && buildingData.unlock.length > 0) {
              for (let newBuilding of buildingData.unlock) {
                if (!v.buildings[newBuilding]) {
                  v.buildings[newBuilding] = {
                    level: 1
                  };
                  if (newBuilding === "goldMine" || newBuilding === "elixirCollector") {
                    v.buildings[newBuilding].lastCollected = Date.now();
                  }
                  isNewBuilding = true;
                }
              }
            }

            saveDB("./lib/database/globalVillages.json", globalVillages);

            let unlockText = "";
            if (isNewBuilding) {
              unlockText = `\n\n*✨ BANGUNAN BARU TERBUKA :* ${buildingData.unlock.join(", ")}!`;
              unlockText += `\n*📌 Ketik /build ${buildingData.unlock[0]} untuk membangunnya!*`;
            }

            await socket.sendMessage(idChat, {
              text: `*🏰 TOWN HALL BERHASIL DIUPGRADE!* 🏰\n\n*Level :* ${currentLevel} *→* ${v.townHall}\n*💰 Biaya :* ${buildingData.cost.toLocaleString()} gold${unlockText}`
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== GOLD MINE =====================
          if (building === "goldmine") {
            if (!v.buildings.goldMine) {
              v.buildings.goldMine = {
                level: 1,
                lastCollected: Date.now()
              };
              saveDB("./lib/database/globalVillages.json", globalVillages);
              await socket.sendMessage(idChat, {
                text: `*🏗️ Gold Mine berhasil dibangun!* *Level :* 1`
              }, {
                quoted: pesan
              });
              break;
            }

            currentLevel = v.buildings.goldMine.level;
            buildingData = buildingsData.goldMine?.[currentLevel + 1];

            if (!buildingData) {
              await socket.sendMessage(idChat, {
                text: "*⛏️ Gold Mine sudah MAX level!*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (v.resources.gold < buildingData.cost) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gold kurang! Butuh ${buildingData.cost.toLocaleString()} gold*`
              }, {
                quoted: pesan
              });
              break;
            }

            v.resources.gold -= buildingData.cost;
            v.buildings.goldMine.level++;
            saveDB("./lib/database/globalVillages.json", globalVillages);

            await socket.sendMessage(idChat, {
              text: `*⛏️ GOLD MINE BERHASIL DIUPGRADE!*\n\n*Level :* ${currentLevel} *→* ${v.buildings.goldMine.level}\n*💰 Biaya :* ${buildingData.cost.toLocaleString()} gold\n*📈 Produksi :* +${buildingData.production}/menit`
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== ELIXIR COLLECTOR =====================
          if (building === "elixircollector" || building === "elixir") {
            if (!v.buildings.elixirCollector) {
              v.buildings.elixirCollector = {
                level: 1,
                lastCollected: Date.now()
              };
              saveDB("./lib/database/globalVillages.json", globalVillages);
              await socket.sendMessage(idChat, {
                text: `*🏗️ Elixir Collector berhasil dibangun!* *Level :* 1`
              }, {
                quoted: pesan
              });
              break;
            }

            currentLevel = v.buildings.elixirCollector.level;
            buildingData = buildingsData.elixirCollector?.[currentLevel + 1];

            if (!buildingData) {
              await socket.sendMessage(idChat, {
                text: "*🧪 Elixir Collector sudah MAX level!*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (v.resources.gold < buildingData.cost) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gold kurang! Butuh ${buildingData.cost.toLocaleString()} gold*`
              }, {
                quoted: pesan
              });
              break;
            }

            v.resources.gold -= buildingData.cost;
            v.buildings.elixirCollector.level++;
            saveDB("./lib/database/globalVillages.json", globalVillages);

            await socket.sendMessage(idChat, {
              text: `*🧪 ELIXIR COLLECTOR BERHASIL DIUPGRADE!*\n\n*Level :* ${currentLevel} *→* ${v.buildings.elixirCollector.level}\n*💰 Biaya :* ${buildingData.cost.toLocaleString()} gold\n*📈 Produksi :* +${buildingData.production}/menit`
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== CANNON =====================
          if (building === "cannon") {
            if (!v.buildings.cannon) {
              let unlockTH = 2;
              if (v.townHall < unlockTH) {
                await socket.sendMessage(idChat, {
                  text: `*❌ Cannon baru unlock di Town Hall ${unlockTH}!*`
                }, {
                  quoted: pesan
                });
                break;
              }
              v.buildings.cannon = {
                level: 1
              };
              saveDB("./lib/database/globalVillages.json", globalVillages);
              await socket.sendMessage(idChat, {
                text: `*🔫 Cannon berhasil dibangun!* *Level :* 1\n*📊 Attack :* ${buildingsData.cannon?.[1]?.attack || 50}`
              }, {
                quoted: pesan
              });
              break;
            }

            currentLevel = v.buildings.cannon.level;
            buildingData = buildingsData.cannon?.[currentLevel + 1];

            if (!buildingData) {
              await socket.sendMessage(idChat, {
                text: "*🔫 Cannon sudah MAX level!*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (v.resources.gold < buildingData.cost) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gold kurang! Butuh ${buildingData.cost.toLocaleString()} gold*`
              }, {
                quoted: pesan
              });
              break;
            }

            v.resources.gold -= buildingData.cost;
            v.buildings.cannon.level++;
            saveDB("./lib/database/globalVillages.json", globalVillages);

            await socket.sendMessage(idChat, {
              text: `*🔫 CANNON BERHASIL DIUPGRADE!*\n\n*Level :* ${currentLevel} *→* ${v.buildings.cannon.level}\n*💰 Biaya :* ${buildingData.cost.toLocaleString()} gold\n*⚔️ Attack :* +${buildingData.attack}`
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== ARCHER TOWER =====================
          if (building === "archertower" || building === "archer") {
            if (!v.buildings.archerTower) {
              let unlockTH = 3;
              if (v.townHall < unlockTH) {
                await socket.sendMessage(idChat, {
                  text: `*❌ Archer Tower baru unlock di Town Hall ${unlockTH}!*`
                }, {
                  quoted: pesan
                });
                break;
              }
              v.buildings.archerTower = {
                level: 1
              };
              saveDB("./lib/database/globalVillages.json", globalVillages);
              await socket.sendMessage(idChat, {
                text: `*🏹 Archer Tower berhasil dibangun!* *Level :* 1\n*📊 Attack :* ${buildingsData.archerTower?.[1]?.attack || 60}`
              }, {
                quoted: pesan
              });
              break;
            }

            currentLevel = v.buildings.archerTower.level;
            buildingData = buildingsData.archerTower?.[currentLevel + 1];

            if (!buildingData) {
              await socket.sendMessage(idChat, {
                text: "*🏹 Archer Tower sudah MAX level!*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (v.resources.gold < buildingData.cost) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gold kurang! Butuh ${buildingData.cost.toLocaleString()} gold*`
              }, {
                quoted: pesan
              });
              break;
            }

            v.resources.gold -= buildingData.cost;
            v.buildings.archerTower.level++;
            saveDB("./lib/database/globalVillages.json", globalVillages);

            await socket.sendMessage(idChat, {
              text: `*🏹 ARCHER TOWER BERHASIL DIUPGRADE!*\n\n*Level :* ${currentLevel} *→* ${v.buildings.archerTower.level}\n*💰 Biaya :* ${buildingData.cost.toLocaleString()} gold\n*⚔️ Attack :* +${buildingData.attack}`
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== MORTAR =====================
          if (building === "mortar") {
            if (!v.buildings.mortar) {
              let unlockTH = 4;
              if (v.townHall < unlockTH) {
                await socket.sendMessage(idChat, {
                  text: `*❌ Mortar baru unlock di Town Hall ${unlockTH}!*`
                }, {
                  quoted: pesan
                });
                break;
              }
              v.buildings.mortar = {
                level: 1
              };
              saveDB("./lib/database/globalVillages.json", globalVillages);
              await socket.sendMessage(idChat, {
                text: `*💣 Mortar berhasil dibangun!* *Level :* 1\n*📊 Attack :* ${buildingsData.mortar?.[1]?.attack || 100}`
              }, {
                quoted: pesan
              });
              break;
            }

            currentLevel = v.buildings.mortar.level;
            buildingData = buildingsData.mortar?.[currentLevel + 1];

            if (!buildingData) {
              await socket.sendMessage(idChat, {
                text: "*💣 Mortar sudah MAX level!*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (v.resources.gold < buildingData.cost) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gold kurang! Butuh ${buildingData.cost.toLocaleString()} gold*`
              }, {
                quoted: pesan
              });
              break;
            }

            v.resources.gold -= buildingData.cost;
            v.buildings.mortar.level++;
            saveDB("./lib/database/globalVillages.json", globalVillages);

            await socket.sendMessage(idChat, {
              text: `*💣 MORTAR BERHASIL DIUPGRADE!*\n\n*Level :* ${currentLevel} *→* ${v.buildings.mortar.level}\n*💰 Biaya :* ${buildingData.cost.toLocaleString()} gold\n*⚔️ Attack :* +${buildingData.attack}`
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== WIZARD TOWER =====================
          if (building === "wizardtower" || building === "wizard") {
            if (!v.buildings.wizardTower) {
              let unlockTH = 5;
              if (v.townHall < unlockTH) {
                await socket.sendMessage(idChat, {
                  text: `*❌ Wizard Tower baru unlock di Town Hall ${unlockTH}!*`
                }, {
                  quoted: pesan
                });
                break;
              }
              v.buildings.wizardTower = {
                level: 1
              };
              saveDB("./lib/database/globalVillages.json", globalVillages);
              await socket.sendMessage(idChat, {
                text: `*🔮 Wizard Tower berhasil dibangun!* *Level :* 1\n*📊 Attack :* ${buildingsData.wizardTower?.[1]?.attack || 150}`
              }, {
                quoted: pesan
              });
              break;
            }

            currentLevel = v.buildings.wizardTower.level;
            buildingData = buildingsData.wizardTower?.[currentLevel + 1];

            if (!buildingData) {
              await socket.sendMessage(idChat, {
                text: "*🔮 Wizard Tower sudah MAX level!*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (v.resources.gold < buildingData.cost) {
              await socket.sendMessage(idChat, {
                text: `*❌ Gold kurang! Butuh ${buildingData.cost.toLocaleString()} gold*`
              }, {
                quoted: pesan
              });
              break;
            }

            v.resources.gold -= buildingData.cost;
            v.buildings.wizardTower.level++;
            saveDB("./lib/database/globalVillages.json", globalVillages);

            await socket.sendMessage(idChat, {
              text: `*🔮 WIZARD TOWER BERHASIL DIUPGRADE!*\n\n*Level :* ${currentLevel} *→* ${v.buildings.wizardTower.level}\n*💰 Biaya :* ${buildingData.cost.toLocaleString()} gold\n*⚔️ Attack :* +${buildingData.attack}`
            }, {
              quoted: pesan
            });
            break;
          }

          // Jika bangunan tidak dikenal
          await socket.sendMessage(idChat, {
            text: `*❌ Bangunan "${building}" tidak dikenal!*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BUILD ERROR:", err);
          await socket.sendMessage(idChat, {
            text: `*❌ Gagal upgrade!*\n\n*Error :* ${err.message}`
          }, {
            quoted: pesan
          });
        }
        break;

      case "attack":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!globalVillages[username]) {
            await socket.sendMessage(idChat, {
              text: "*🏰 Buat desa dulu dengan /village!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let v = globalVillages[username];
          let totalTroops = getTroopCount(v.troops);

          if (totalTroops < 5) {
            await socket.sendMessage(idChat, {
              text: "*❌ Pasukan minimal 5 unit untuk menyerang!*\n📌 Ketik /train untuk latih pasukan"
            }, {
              quoted: pesan
            });
            break;
          }

          let directTarget = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (directTarget) {
            if (!users[directTarget]) {
              await socket.sendMessage(idChat, {
                text: "*❌ Target belum terdaftar!*"
              }, {
                quoted: pesan
              });
              break;
            }

            let targetUsername = users[directTarget].username;

            if (targetUsername === username) {
              await socket.sendMessage(idChat, {
                text: "*❌ Tidak bisa menyerang desa sendiri!*"
              }, {
                quoted: pesan
              });
              break;
            }

            let targetVillage = globalVillages[targetUsername];
            if (!targetVillage) {
              await socket.sendMessage(idChat, {
                text: "*❌ Desa target tidak ditemukan!*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (targetVillage.shield && targetVillage.shield > Date.now()) {
              let hoursLeft = Math.ceil((targetVillage.shield - Date.now()) / 3600000);
              await socket.sendMessage(idChat, {
                text: `*🛡️ Desa ${targetVillage.name} sedang dalam masa shield!*\n⏰ Sisa ${hoursLeft} jam lagi`
              }, {
                quoted: pesan
              });
              break;
            }

            let result = await executeAttack(username, targetUsername, idChat, socket, pesan);
            if (result) {
              await socket.sendMessage(idChat, {
                text: result
              }, {
                quoted: pesan
              });
            }
          } else {
            let availableTargets = [];
            for (let [user, village] of Object.entries(globalVillages)) {
              if (user !== username && village) {
                availableTargets.push(user);
              }
            }

            if (availableTargets.length === 0) {
              await socket.sendMessage(idChat, {
                text: "*🌍 Tidak ada desa lain yang tersedia untuk diserang!*"
              }, {
                quoted: pesan
              });
              break;
            }

            let randomTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
            let targetVillage = globalVillages[randomTarget];
            let targetProfile = users[getUserIdByUsername(randomTarget)];

            attackSearch[username] = {
              targetUsername: randomTarget,
              targetName: targetVillage.name,
              targetDisplay: targetProfile?.displayName || randomTarget,
              targetTH: targetVillage.townHall,
              targetTrophies: targetVillage.trophies,
              time: Date.now()
            };

            let teks = `*⚔️ MUSUH DITEMUKAN!* ⚔️\n\n`;
            teks += `*🏰 Desa : ${targetVillage.name}*\n`;
            teks += `*👤 Pemilik : ${targetProfile?.displayName || randomTarget}*\n`;
            teks += `*🏆 Trophies : ${targetVillage.trophies}*\n`;
            teks += `*📊 Town Hall : ${targetVillage.townHall}*\n\n`;
            teks += `*🛡️ Pertahanan : ${getDefensePower(targetVillage)}*\n`;
            teks += `*💰 Perkiraan Loot : ${Math.floor(500 + targetVillage.townHall * 100)} gold*\n\n`;
            teks += `*📌 Balas pesan ini dengan /confirm untuk menyerang!*\n`;
            teks += `*📌 Atau ketik /attack lagi untuk mencari musuh lain.*`;

            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            });
          }

        } catch (err) {
          console.log("ATTACK ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menyerang!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "confirm":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // 🔥 DEFINISIKAN USERNAME DULU
          let username = users[pengirim].username;

          let searchData = attackSearch[username];

          if (!searchData || Date.now() - searchData.time > 60000) {
            delete attackSearch[username];
            await socket.sendMessage(idChat, {
              text: "*⏰ Waktu pencarian habis! Ketik /attack lagi untuk mencari musuh.*"
            }, {
              quoted: pesan
            });
            break;
          }

          let result = await executeAttack(username, searchData.targetUsername, idChat, socket, pesan);
          await socket.sendMessage(idChat, {
            text: result
          }, {
            quoted: pesan
          });
          delete attackSearch[username];

        } catch (err) {
          console.log("CONFIRM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal konfirmasi attack!*\n\n*Error :* " + err.message
          }, {
            quoted: pesan
          });
        }
        break;

        // ===================== COMMAND MARKETPLACE (GLOBAL) =====================

      case "sell":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (args.length < 3) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh : /sell Ikan Mas 5 10000*\n*📌 Format: /sell [Nama Ikan] [Jumlah] [Harga/Ekor]*"
            }, {
              quoted: pesan
            });
            break;
          }

          let quantity = parseInt(args[args.length - 2]);
          let price = parseInt(args[args.length - 1]);
          let fishName = args.slice(0, args.length - 2).join(" ");

          if (isNaN(quantity) || quantity <= 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Jumlah harus lebih dari 0!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (isNaN(price) || price <= 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Harga harus lebih dari 0!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!globalFishInventory[username] || !globalFishInventory[username].fishList.length) {
            await socket.sendMessage(idChat, {
              text: "*🎣 GAGAL!*\n\n*Kamu tidak memiliki ikan apapun! Coba mancing dulu dengan /fish*"
            }, {
              quoted: pesan
            });
            break;
          }

          let userFishInv = globalFishInventory[username];
          let fishData = null;
          let fishNameLower = fishName.toLowerCase().trim();

          for (let rarity of ["basic", "rare", "legendary", "mythic", "secret"]) {
            let found = (fishCatalog.fish[rarity] || []).find(f => f.name.toLowerCase() === fishNameLower);
            if (found) {
              fishData = {
                ...found,
                rarity: rarity
              };
              break;
            }
          }

          if (!fishData) {
            await socket.sendMessage(idChat, {
              text: `*❌ Ikan "${fishName}" tidak ditemukan di katalog!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let fishToSell = [];
          let fishIndexes = [];

          for (let i = 0; i < userFishInv.fishList.length; i++) {
            if (userFishInv.fishList[i].name.toLowerCase() === fishNameLower && fishToSell.length < quantity) {
              fishToSell.push(userFishInv.fishList[i]);
              fishIndexes.push(i);
            }
          }

          if (fishToSell.length < quantity) {
            await socket.sendMessage(idChat, {
              text: `*❌ Kamu hanya memiliki ${fishToSell.length} ekor ikan ${fishData.name}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          for (let i = fishIndexes.length - 1; i >= 0; i--) {
            userFishInv.fishList.splice(fishIndexes[i], 1);
            userFishInv.totalFish--;
            userFishInv.stats[fishData.rarity]--;
          }

          const productId = Date.now() + "_" + Math.random().toString(36).substring(2, 8);

          globalMarketplace[productId] = {
            id: productId,
            fishName: fishData.name,
            fishEmoji: fishData.emoji,
            rarity: fishData.rarity,
            quantity: quantity,
            price: price,
            seller: username,
            sellerName: username,
            sellerDisplay: users[pengirim]?.displayName || username,
            time: Date.now()
          };

          saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
          saveDB("./lib/database/globalMarketplace.json", globalMarketplace);

          const rarityIcon = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };

          await socket.sendMessage(idChat, {
            text: `*✅ BERHASIL MENJUAL IKAN!*\n\n*🐟 ${fishData.emoji} ${fishData.name} ${rarityIcon[fishData.rarity]}*\n*📦 Jumlah : ${quantity} ekor*\n*💰 Harga : Rp${price.toLocaleString()}/ekor*\n*💎 Total : Rp${(price * quantity).toLocaleString()}*\n\n*📌 Ketik /marketlist 1 untuk melihat produk*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("SELL ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal menjual ikan. Coba lagi nanti.*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "buy":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh : /buy 1700000000_abc123 2*\n*📌 Cek ID produk dengan /marketlist*"
            }, {
              quoted: pesan
            });
            break;
          }

          let productId = args[0];
          let buyQuantity = args[1] ? parseInt(args[1]): 1;

          if (isNaN(buyQuantity) || buyQuantity <= 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Jumlah harus lebih dari 0!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let product = globalMarketplace[productId];
          if (!product) {
            await socket.sendMessage(idChat, {
              text: `*❌ Produk dengan ID "${productId}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (product.seller === username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Tidak bisa membeli produk sendiri!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (buyQuantity > product.quantity) {
            await socket.sendMessage(idChat, {
              text: `*❌ Stok tidak mencukupi! Tersisa ${product.quantity} ekor.*`
            }, {
              quoted: pesan
            });
            break;
          }

          let totalPrice = buyQuantity * product.price;
          let buyerSaldo = globalSaldo[username] || 0;

          if (buyerSaldo < totalPrice) {
            await socket.sendMessage(idChat, {
              text: `*❌ Saldo tidak cukup! Butuh Rp${totalPrice.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          globalSaldo[username] = buyerSaldo - totalPrice;
          globalSaldo[product.seller] = (globalSaldo[product.seller] || 0) + totalPrice;

          if (!globalFishInventory[username]) {
            globalFishInventory[username] = {
              totalCasts: 0,
              totalFish: 0,
              fishList: [],
              stats: {
                basic: 0,
                rare: 0,
                legendary: 0,
                mythic: 0,
                secret: 0
              }
            };
          }

          for (let i = 0; i < buyQuantity; i++) {
            globalFishInventory[username].fishList.unshift({
              name: product.fishName,
              rarity: product.rarity,
              emoji: product.fishEmoji,
              location: "Marketplace",
              time: Date.now()
            });
            globalFishInventory[username].totalFish++;
            globalFishInventory[username].stats[product.rarity]++;
          }

          if (buyQuantity === product.quantity) {
            delete globalMarketplace[productId];
          } else {
            product.quantity -= buyQuantity;
            globalMarketplace[productId] = product;
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
          saveDB("./lib/database/globalMarketplace.json", globalMarketplace);

          const rarityIcon = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };

          let sellerId = getUserIdByUsername(product.seller);
          if (sellerId) {
            await socket.sendMessage(sellerId, {
              text: `*💰 PRODUK TERJUAL!* 💰\n\n*🐟 ${product.fishEmoji} ${product.fishName} ${rarityIcon[product.rarity]}*\n*📦 Terjual : ${buyQuantity} ekor*\n*💰 Pendapatan : +Rp${totalPrice.toLocaleString()}*\n*👤 Dibeli oleh : ${username}*\n*📅 Waktu : ${new Date().toLocaleString("id-ID")}*`
            }).catch(() => {});
          }

          await socket.sendMessage(idChat, {
            text: `*✅ PEMBELIAN BERHASIL!* ✅\n\n*🐟 ${product.fishEmoji} ${product.fishName} ${rarityIcon[product.rarity]}*\n*📦 ${buyQuantity} ekor*\n*💰 Harga : Rp${product.price.toLocaleString()}/ekor*\n*💎 Total : Rp${totalPrice.toLocaleString()}*\n\n*💳 Sisa saldo : Rp${globalSaldo[username].toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BUY ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal membeli produk. Coba lagi nanti.*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "marketlist":
        try {
          let page = parseInt(args[0]) || 1;
          const itemsPerPage = 10;

          let products = Object.values(globalMarketplace).sort((a, b) => b.time - a.time);
          let totalProducts = products.length;
          let totalPages = Math.ceil(totalProducts / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages && totalPages > 0) page = totalPages;

          if (totalProducts === 0) {
            await socket.sendMessage(idChat, {
              text: "*🛒 MARKETPLACE KOSONG!*\n\n*Belum ada produk yang dijual. Jadilah yang pertama dengan /sell*"
            }, {
              quoted: pesan
            });
            break;
          }

          const startIdx = (page - 1) * itemsPerPage;
          const endIdx = startIdx + itemsPerPage;
          const pageProducts = products.slice(startIdx, endIdx);

          function formatProductText(product, no) {
            const rarityIcon = {
              basic: "⭐",
              rare: "✨",
              legendary: "🔥",
              mythic: "👑",
              secret: "💎"
            };
            let teks = `${no}. ${product.fishEmoji} *${product.fishName}* ${rarityIcon[product.rarity]}\n`;
            teks += `   📦 *Stok : ${product.quantity} ekor | 💰 Rp${product.price.toLocaleString()}/ekor*\n`;
            teks += `   👤 *Penjual : ${product.sellerDisplay || product.seller}*\n`;
            teks += `   🆔 *ID : ${product.id}*\n\n`;
            return teks;
          }

          let teks = `*🛒 MARKETPLACE IKAN* 🛒\n\n`;
          teks += `*📊 Total produk : ${totalProducts}*\n`;
          teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*📋 Menampilkan produk ${startIdx + 1} - ${Math.min(endIdx, totalProducts)}*\n\n`;

          let no = startIdx + 1;
          for (let product of pageProducts) {
            teks += formatProductText(product, no);
            no++;
          }

          if (totalPages > 1) {
            teks += `*📌 Navigasi :*\n`;
            if (page > 1) teks += `• *Halaman sebelumnya : /marketlist ${page - 1}*\n`;
            if (page < totalPages) teks += `• *Halaman berikutnya : /marketlist ${page + 1}*\n`;
            teks += `\n`;
          }

          teks += `*📌 Cara beli : /buy [ID Produk] [jumlah]*\n`;
          teks += `*📌 Contoh : /buy 1700000000_abc123 2*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("MARKETLIST ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal menampilkan daftar produk.*"
          }, {
            quoted: pesan
          });
        }
        break;

        // ===================== COMMAND FISHBOT (GLOBAL) =====================

      case "fish":
        try {
          // Cek login DULU sebelum ambil username
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userFish = globalFishInventory[username];

          if (!userFish) {
            globalFishInventory[username] = {
              totalCasts: 0,
              totalFish: 0,
              fishList: [],
              stats: {
                basic: 0,
                rare: 0,
                legendary: 0,
                mythic: 0,
                secret: 0
              }
            };
            userFish = globalFishInventory[username];
          }

          // 🔥 Gunakan userLocation berbasis username
          let userLocationData = loadDB("./lib/database/userLocation.json") || {};
          let location = null;

          if (args.length) {
            location = args.join(" ");
          } else if (userLocationData[username]) {
            // ✅ Pakai username, bukan JID
            location = userLocationData[username];
          }

          if (location) {
            let validLocations = fishCatalog.locations?.map(l => l.name) || [];
            let matchedLocation = validLocations.find(l => l.toLowerCase() === location.toLowerCase());
            if (!matchedLocation) {
              await socket.sendMessage(idChat, {
                text: `*❌ LOKASI "${location}" TIDAK VALID!*`
              }, {
                quoted: pesan
              });
              break;
            }
            location = matchedLocation;
          }

          let eligibleFish = [];
          let rarityOrder = ["basic",
            "rare",
            "legendary",
            "mythic",
            "secret"];

          for (let rarity of rarityOrder) {
            let fishList = fishCatalog.fish?.[rarity] || [];
            for (let fish of fishList) {
              if (fish.location === "All" || fish.location === location) {
                eligibleFish.push({
                  ...fish, rarity: rarity
                });
              }
            }
          }

          if (eligibleFish.length === 0) {
            await socket.sendMessage(idChat, {
              text: `*❌ TIDAK ADA IKAN DI LOKASI ${location || "tersebut"}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          const randomNum = Math.random() * 100;
          let filteredFish = eligibleFish;

          if (randomNum < 0.001) {
            filteredFish = eligibleFish.filter(f => f.rarity === "secret");
            if (filteredFish.length === 0) filteredFish = eligibleFish.filter(f => f.rarity === "mythic");
            if (filteredFish.length === 0) filteredFish = eligibleFish;
          } else if (randomNum < 0.001) {
            filteredFish = eligibleFish.filter(f => f.rarity === "mythic");
            if (filteredFish.length === 0) filteredFish = eligibleFish.filter(f => f.rarity === "legendary");
            if (filteredFish.length === 0) filteredFish = eligibleFish;
          } else if (randomNum < 0.002) {
            filteredFish = eligibleFish.filter(f => f.rarity === "legendary");
            if (filteredFish.length === 0) filteredFish = eligibleFish.filter(f => f.rarity === "rare");
            if (filteredFish.length === 0) filteredFish = eligibleFish;
          } else if (randomNum < 1) {
            filteredFish = eligibleFish.filter(f => f.rarity === "rare");
            if (filteredFish.length === 0) filteredFish = eligibleFish;
          }

          const caughtFish = filteredFish[Math.floor(Math.random() * filteredFish.length)];

          userFish.totalCasts++;
          userFish.totalFish++;
          userFish.stats[caughtFish.rarity]++;
          userFish.fishList.unshift({
            name: caughtFish.name,
            rarity: caughtFish.rarity,
            emoji: caughtFish.emoji,
            location: caughtFish.location,
            time: Date.now()
          });

          saveDB("./lib/database/globalFishInventory.json", globalFishInventory);

          const rarityIcon = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };
          const rarityText = {
            basic: "Basic",
            rare: "Rare",
            legendary: "LEGENDARY",
            mythic: "MYTHIC",
            secret: "SECRET"
          };
          let locationDisplay = location || caughtFish.location;

          await socket.sendMessage(idChat, {
            text: `*🎣 FISHING TIME!* 🎣\n*📍 Lokasi : ${locationDisplay}*\n\n*Kamu mendapatkan : ${caughtFish.emoji} ${caughtFish.name} ${rarityIcon[caughtFish.rarity]}*\n*📊 Rarity : ${rarityText[caughtFish.rarity]}*\n*📈 Total ikan : ${userFish.totalFish}*\n*📊 Stats : ⭐${userFish.stats.basic} || ✨${userFish.stats.rare} || 🔥${userFish.stats.legendary} || 👑${userFish.stats.mythic} || 💎${userFish.stats.secret}*\n\n*📌 Ketik /movemap untuk pindah lokasi*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("FISH ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal memancing!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "movemap":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userLocationData = loadDB("./lib/database/userLocation.json") || {};

          if (!args[0]) {
            let fishCatalogMap = loadDB("./lib/database/fishCatalog.json") || {};
            let locationsMap = fishCatalogMap.locations || [];
            let teksMap = `*🗺️ PINDAH LOKASI MEMANCING* 🗺️\n\n*📍 Lokasi yang tersedia :*\n`;
            for (let loc of locationsMap) {
              teksMap += `${loc.icon} *${loc.name}*\n`;
            }
            teksMap += `\n*📌 Contoh : /movemap Starter Cove*\n*📌 Lokasimu sekarang: ${userLocationData[username] || "Belum diatur"}*`;

            await socket.sendMessage(idChat, {
              text: teksMap
            }, {
              quoted: pesan
            });
            break;
          }

          let fishCatalogMove = loadDB("./lib/database/fishCatalog.json") || {};
          let validLocationsMove = (fishCatalogMove.locations || []).map(l => l.name);
          let newLocationInput = args.join(" ");
          let matchedLocation = validLocationsMove.find(l => l.toLowerCase() === newLocationInput.toLowerCase());

          if (!matchedLocation) {
            await socket.sendMessage(idChat, {
              text: `*❌ LOKASI "${newLocationInput}" TIDAK VALID!*`
            }, {
              quoted: pesan
            });
            break;
          }

          userLocationData[username] = matchedLocation; // ✅ Pakai username
          saveDB("./lib/database/userLocation.json", userLocationData);

          let locationData = fishCatalogMove.locations.find(l => l.name === matchedLocation);
          let icon = locationData ? locationData.icon: "🏝️";

          await socket.sendMessage(idChat, {
            text: `*🗺️ BERHASIL PINDAH LOKASI!* 🗺️\n\n*📍 Lokasi baru : ${icon} ${matchedLocation}*\n*📊 Tingkat : ${locationData ? locationData.difficulty: "-"}*\n\n*📌 Sekarang ketik /fish untuk memancing di lokasi ini.*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("MOVEMAP ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal pindah lokasi!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "cekmap":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userLocationData = loadDB("./lib/database/userLocation.json") || {};
          let fishCatalogCek = loadDB("./lib/database/fishCatalog.json") || {};

          let currentLoc = userLocationData[username];

          if (!currentLoc) {
            await socket.sendMessage(idChat, {
              text: `*🗺️ BELUM PUNYA LOKASI AKTIF!*\n\n*📌 Pilih lokasi dengan /movemap [nama lokasi]*\n*📌 Contoh : /movemap Starter Cove*\n\n*📍 Lokasi yang tersedia :*\n${fishCatalogCek.locations?.map(l => `• ${l.icon} *${l.name}*`).join("\n") || "Tidak ada lokasi"}`
            }, {
              quoted: pesan
            });
            break;
          }

          let locData = fishCatalogCek.locations?.find(l => l.name === currentLoc);

          await socket.sendMessage(idChat, {
            text: `*🗺️ LOKASI AKTIF ANDA* 🗺️\n\n*📍 Lokasi : ${locData ? locData.icon: "🏝️"} ${currentLoc}*\n*📊 Tingkat : ${locData ? locData.difficulty: "-"}*\n*👤 User : @${username}*\n\n*📌 Ketik /fish untuk memancing*\n*📌 Ketik /movemap [nama] untuk pindah lokasi*`,
            mentions: [pengirim]
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CEKMAP ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mengecek lokasi!*\n\n*Error: " + err.message
          }, {
            quoted: pesan
          });
        }
        break;

      case "listfish":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let userFish = globalFishInventory[username];

          if (!userFish || userFish.fishList.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*🎣 KOSONG!*\n\n*Kamu belum pernah menangkap ikan! Ketik /fish untuk mulai memancing.*"
            }, {
              quoted: pesan
            });
            break;
          }

          let grouped = {
            basic: {},
            rare: {},
            legendary: {},
            mythic: {},
            secret: {}
          };
          for (let fish of userFish.fishList) {
            grouped[fish.rarity][fish.name] = (grouped[fish.rarity][fish.name] || 0) + 1;
          }

          let teks = `*🎣 INVENTORY IKAN* 🎣\n\n`;
          teks += `*📊 Total ikan : ${userFish.totalFish} ekor*\n`;
          teks += `*🎣 Total casting : ${userFish.totalCasts} kali*\n\n`;

          const rarityOrder = [{
            key: "basic",
            icon: "⭐",
            name: "BASIC"
          },
            {
              key: "rare",
              icon: "✨",
              name: "RARE"
            },
            {
              key: "legendary",
              icon: "🔥",
              name: "LEGENDARY"
            },
            {
              key: "mythic",
              icon: "👑",
              name: "MYTHIC"
            },
            {
              key: "secret",
              icon: "💎",
              name: "SECRET"
            }];

          for (let rarity of rarityOrder) {
            let fishData = grouped[rarity.key];
            let total = Object.values(fishData).reduce((a, b) => a + b, 0);
            if (total > 0) {
              teks += `${rarity.icon} *${rarity.name} (${total} ekor)*\n`;
              let sortedNames = Object.keys(fishData).sort((a, b) => fishData[b] - fishData[a]);
              for (let name of sortedNames.slice(0, 15)) {
                teks += `   • ${name} x${fishData[name]}\n`;
              }
              teks += `\n`;
            }
          }

          teks += `*📌 Ketik /fish untuk memancing lagi!*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("LISTFISH ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal menampilkan daftar ikan.*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "tffish":
        try {
          let username = users[pengirim].username;
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let userFish = globalFishInventory[username];

          if (!userFish || userFish.fishList.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*🎣 GAGAL!\n\n*Kamu belum punya ikan!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let mentionTf = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
          let targetUser = mentionTf || args[0];

          if (!targetUser) {
            await socket.sendMessage(idChat, {
              text: "*❌ FORMAT SALAH!*\n\n*/tffish @user Nama Ikan 5*"
            }, {
              quoted: pesan
            });
            break;
          }

          let targetUsername = null;
          if (mentionTf && users[mentionTf]) {
            targetUsername = users[mentionTf].username;
          } else {
            targetUsername = targetUser.toLowerCase();
            if (!isUserExists(targetUsername)) {
              await socket.sendMessage(idChat, {
                text: `*❌ User @${targetUsername} tidak ditemukan!*`
              }, {
                quoted: pesan
              });
              break;
            }
          }

          if (targetUsername === username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Tidak bisa transfer ke diri sendiri!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let rawArgs = mentionTf ? args.slice(1): args.slice(1);
          if (rawArgs.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Masukkan nama ikan!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let qty = 1;
          let lastArg = rawArgs[rawArgs.length - 1];
          if (!isNaN(parseInt(lastArg))) {
            qty = parseInt(lastArg); rawArgs.pop();
          }

          let fishName = rawArgs.join(" ").toLowerCase();

          if (fishName === "all") {
            if (!globalFishInventory[targetUsername]) {
              globalFishInventory[targetUsername] = {
                totalCasts: 0,
                totalFish: 0,
                fishList: [],
                stats: {
                  basic: 0,
                  rare: 0,
                  legendary: 0,
                  mythic: 0,
                  secret: 0
                }
              };
            }

            for (let fish of userFish.fishList) {
              globalFishInventory[targetUsername].fishList.push(fish);
              globalFishInventory[targetUsername].totalFish++;
              globalFishInventory[targetUsername].stats[fish.rarity]++;
            }

            globalFishInventory[username].fishList = [];
            globalFishInventory[username].totalFish = 0;
            globalFishInventory[username].stats = {
              basic: 0,
              rare: 0,
              legendary: 0,
              mythic: 0,
              secret: 0
            };

            saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
            await socket.sendMessage(idChat, {
              text: `*✅ Semua ikan berhasil ditransfer ke @${targetUsername}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let fishToTransfer = [],
          indexes = [];
          for (let i = 0; i < userFish.fishList.length; i++) {
            if (userFish.fishList[i].name.toLowerCase() === fishName && fishToTransfer.length < qty) {
              fishToTransfer.push(userFish.fishList[i]);
              indexes.push(i);
            }
          }

          if (fishToTransfer.length === 0) {
            await socket.sendMessage(idChat, {
              text: `*❌ Kamu tidak punya ikan "${fishName}"*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (!globalFishInventory[targetUsername]) {
            globalFishInventory[targetUsername] = {
              totalCasts: 0,
              totalFish: 0,
              fishList: [],
              stats: {
                basic: 0,
                rare: 0,
                legendary: 0,
                mythic: 0,
                secret: 0
              }
            };
          }

          for (let i = indexes.length - 1; i >= 0; i--) {
            userFish.fishList.splice(indexes[i], 1);
            userFish.totalFish--;
            userFish.stats[fishToTransfer[i].rarity]--;
            globalFishInventory[targetUsername].fishList.push(fishToTransfer[i]);
            globalFishInventory[targetUsername].totalFish++;
            globalFishInventory[targetUsername].stats[fishToTransfer[i].rarity]++;
          }

          saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
          await socket.sendMessage(idChat, {
            text: `*✅ TRANSFER BERHASIL!*\n\n*🎣 ${fishToTransfer.length}x ${fishToTransfer[0].name} ke @${targetUsername}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log(err);
        }
        break;

        // ===================== COMMAND AFK FISH (GLOBAL) =====================

      case "afkfish":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let isVerifiedUser = verifiedData.verifiedUsers.includes(username);
          let duration = isVerifiedUser ? Infinity: 60 * 60 * 1000; // Unlimited / 60 menit
          let durationMinutes = isVerifiedUser ? "UNLIMITED (∞)": "60";

          // ========== OFF ==========
          if (args[0] && args[0].toLowerCase() === "off") {
            if (!afkData[username] || !afkData[username].active) {
              await socket.sendMessage(idChat, {
                text: "*❌ TIDAK SEDANG AFK FISHING!*\n\n*📌 Ketik /afkfish on untuk memulai.*"
              }, {
                quoted: pesan
              });
              break;
            }

            if (afkIntervals[username]) {
              clearInterval(afkIntervals[username]);
              delete afkIntervals[username];
            }

            let sesi = afkData[username];
            let durasi = Math.round((Date.now() - sesi.startTime) / 1000 / 60);
            delete afkData[username];
            saveDB("./lib/database/afkFish.json", afkData);

            await socket.sendMessage(idChat, {
              text: `*✅ AFK FISHING DIHENTIKAN!* ✅\n\n*📊 Total ikan : ${sesi.totalCatch} ekor*\n*📍 Lokasi : ${sesi.location || "Random"}*\n*⏰ Durasi : ${durasi} menit*`
            }, {
              quoted: pesan
            });
            break;
          }

          // ========== ON ==========
          if (args[0] && args[0].toLowerCase() === "on") {
            if (afkData[username]?.active) {
              let sisa = isVerifiedUser ? "UNLIMITED": afkData[username].endTime - Date.now();
              let menit = !isVerifiedUser ? Math.floor(sisa / 60000): 0;
              await socket.sendMessage(idChat, {
                text: `*🎣 AFK FISHING SEDANG AKTIF!*\n\n*📊 Ikan terkumpul : ${afkData[username].totalCatch} ekor*\n*⏰ Sisa waktu : ${isVerifiedUser ? "UNLIMITED": menit + " menit"}*\n\n*📌 Ketik /afkfish off untuk membatalkan.*`
              }, {
                quoted: pesan
              });
              break;
            }

            let endTime = isVerifiedUser ? Infinity: Date.now() + duration;
            let userLocationData = loadDB("./lib/database/userLocation.json") || {};
            let location = userLocationData[username] || null;

            afkData[username] = {
              active: true,
              startTime: Date.now(),
              endTime: endTime,
              location: location,
              totalCatch: 0
            };
            saveDB("./lib/database/afkFish.json", afkData);

            await socket.sendMessage(idChat, {
              text: `*🎣 AFK FISHING DIAKTIFKAN!*\n\n*📍 Lokasi : ${location || "Random"}*\n*⏰ Durasi : ${durationMinutes} menit*\n\n*📌 Ketik /afkfish off untuk membatalkan.*\n*📌 Bot akan memancing otomatis untukmu!*`
            }, {
              quoted: pesan
            });

            if (afkIntervals[username]) clearInterval(afkIntervals[username]);

            afkIntervals[username] = setInterval(async () => {
              try {
                let currentAfk = afkData;
                if (!currentAfk[username] || !currentAfk[username].active) {
                  clearInterval(afkIntervals[username]);
                  delete afkIntervals[username];
                  return;
                }

                // Cek waktu selesai (hanya untuk user non-verified)
                if (!isVerifiedUser && Date.now() >= currentAfk[username].endTime) {
                  clearInterval(afkIntervals[username]);
                  delete afkIntervals[username];
                  let hasil = currentAfk[username];
                  delete currentAfk[username];
                  saveDB("./lib/database/afkFish.json", currentAfk);
                  await socket.sendMessage(idChat, {
                    text: `*🎣 AFK FISHING SELESAI!*\n\n*📊 Total ikan : ${hasil.totalCatch} ekor*\n*📍 Lokasi : ${hasil.location || "Random"}*\n*📌 Ketik /fish untuk memancing lagi!*`
                  }, {
                    quoted: pesan
                  });
                  return;
                }

                let eligible = [];
                let rarityList = ["basic",
                  "rare",
                  "legendary",
                  "mythic",
                  "secret"];
                let loc = currentAfk[username].location;

                for (let r of rarityList) {
                  let list = fishCatalog.fish?.[r] || [];
                  for (let f of list) {
                    if (!loc || f.location === "All" || f.location === loc) {
                      eligible.push({
                        ...f, rarity: r
                      });
                    }
                  }
                }

                if (eligible.length === 0) return;

                let roll = Math.random() * 100;
                let pool = eligible;
                if (roll < 0.001) pool = eligible.filter(f => f.rarity === "secret");
                else if (roll < 0.001) pool = eligible.filter(f => f.rarity === "mythic");
                else if (roll < 0.002) pool = eligible.filter(f => f.rarity === "legendary");
                else if (roll < 1) pool = eligible.filter(f => f.rarity === "rare");
                if (pool.length === 0) pool = eligible;

                let fish = pool[Math.floor(Math.random() * pool.length)];

                if (!globalFishInventory[username]) {
                  globalFishInventory[username] = {
                    totalCasts: 0,
                    totalFish: 0,
                    fishList: [],
                    stats: {
                      basic: 0,
                      rare: 0,
                      legendary: 0,
                      mythic: 0,
                      secret: 0
                    }
                  };
                }

                let userInv = globalFishInventory[username];
                userInv.fishList.unshift({
                  name: fish.name,
                  rarity: fish.rarity,
                  emoji: fish.emoji,
                  location: fish.location === "All" ? (loc || "Random"): fish.location,
                  time: Date.now()
                });
                userInv.totalFish++;
                userInv.stats[fish.rarity]++;

                currentAfk[username].totalCatch++;

                saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
                saveDB("./lib/database/afkFish.json", currentAfk);

              } catch (e) {
                console.log("AFK ERROR:", e);
              }
            },
              30000);

            break;
          }

          // ========== STATUS ==========
          if (!args[0]) {
            if (afkData[username]?.active) {
              let sisa = isVerifiedUser ? "UNLIMITED": afkData[username].endTime - Date.now();
              let menit = !isVerifiedUser ? Math.floor(sisa / 60000): 0;
              let detik = !isVerifiedUser ? Math.floor((sisa % 60000) / 1000): 0;

              await socket.sendMessage(idChat, {
                text: `*📋 STATUS AFK FISHING* 📋\n\n*✅ Mode : AKTIF*\n*🎣 Ikan terkumpul : ${afkData[username].totalCatch} ekor*\n*⏰ Sisa waktu : ${isVerifiedUser ? "UNLIMITED (∞)": menit + " menit " + detik + " detik"}*\n*📍 Lokasi : ${afkData[username].location || "Random"}*\n\n*📌 Ketik /afkfish off untuk membatalkan.*`
              }, {
                quoted: pesan
              });
            } else {
              await socket.sendMessage(idChat, {
                text: `*📋 STATUS AFK FISHING* 📋\n\n*❌ Mode :* NONAKTIF\n\n*📌 Ketik /afkfish on untuk memulai auto fishing ${durationMinutes} menit.*`
              }, {
                quoted: pesan
              });
            }
          }

        } catch (err) {
          console.log("AFKFISH ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR AFK FISHING!*\n\n*Error :* " + err.message
          }, {
            quoted: pesan
          });
        }
        break;

      case "login":
      case "register":
        try {
          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*🔐 Login hanya bisa dilakukan di private chat agar datamu tetap aman dan terjaga!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== LOGIN =====================
          if (args[0] && args[0].toLowerCase() === "login") {
            if (!args[1] || !args[2]) {
              await socket.sendMessage(idChat, {
                text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh: /login login kaelorix password123*"
              }, {
                quoted: pesan
              });
              break;
            }

            let loginUsername = args[1].toLowerCase();
            let loginPassword = args[2];

            // ✅ CARI USER DI SEMUA ENTRIES (TERMASUK "Tak dikenal")
            let targetUserId = null;
            let targetUserData = null;

            for (let [userId, data] of Object.entries(users)) {
              if (data.username === loginUsername) {
                targetUserId = userId;
                targetUserData = data;
                break;
              }
            }

            if (!targetUserData) {
              await socket.sendMessage(idChat, {
                text: `*❌ Username @${loginUsername} tidak ditemukan!*\n*📌 /register untuk daftar akun baru*`
              }, {
                quoted: pesan
              });
              break;
            }

            // Verifikasi password
            const isValid = await bcrypt.compare(loginPassword, targetUserData.password);

            if (!isValid) {
              await socket.sendMessage(idChat, {
                text: "*❌ Password salah!*"
              }, {
                quoted: pesan
              });
              break;
            }

            // ✅ CEK APAKAH USER SUDAH LOGIN DI PERANGKAT LAIN
            if (users[pengirim]) {
              await socket.sendMessage(idChat, {
                text: "*⚠️ PERANGKAT INI SUDAH TERHUBUNG DENGAN AKUN LAIN!*\n\n*📌 Logout dulu dengan /logout sebelum login ke akun lain.*"
              }, {
                quoted: pesan
              });
              break;
            }

            // ✅ HAPUS DEVICE LAMA (JIKA ADA)
            if (targetUserId !== "Tak dikenal" && targetUserId !== pengirim) {
              delete users[targetUserId];
            }

            // ✅ LOGIN KE PERANGKAT INI
            users[pengirim] = {
              ...targetUserData,
              lastLogin: Date.now(),
              lastDevice: pengirim
            };

            saveDB("./lib/database/users.json", users);

            // Migrasi data jika perlu
            await migrateUserData(pengirim);

            await socket.sendMessage(idChat, {
              text: `*✅ LOGIN BERHASIL!* ✅\n\n*👤 Selamat datang kembali, ${targetUserData.displayName}!*\n*📛 Username : @${loginUsername}*\n*💰 Saldo : Rp${(globalSaldo[loginUsername] || 0).toLocaleString()}*\n\n*📌 Data akun Anda telah disinkronkan ke perangkat ini.*`
            }, {
              quoted: pesan
            });
            break;
          }

          // ===================== REGISTER (BUAT AKUN BARU) =====================
          if (users[pengirim]) {
            let user = users[pengirim];
            await migrateUserData(pengirim);

            await socket.sendMessage(idChat, {
              text: `*✅ ANDA SUDAH LOGIN!*\n\n*👤 Username : @${user.username}*\n*📛 Display : ${user.displayName}*\n*📅 Bergabung : ${new Date(user.registeredAt).toLocaleDateString("id-ID")}*\n*💎 Saldo : Rp${(globalSaldo[user.username] || 0).toLocaleString()}*\n\n*📌 Gunakan /profile untuk lihat detail*\n*📌 Gunakan /changename [nama baru] untuk ganti nama*\n*📌 Gunakan /setpassword [password] untuk membuat/buka kunci password*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Form register
          if (!args[0]) {
            let teks = `*🎭 SELAMAT DATANG DI BOT GAME!* 🎭\n\n`;
            teks += `*📝 Daftarkan akun baru!*\n\n`;
            teks += `*📌 Cara daftar:*\n`;
            teks += `/register [username] [password] [displayName?]\n\n`;
            teks += `*Contoh:*\n`;
            teks += `/register kaelorix password123 Kael\n\n`;
            teks += `*⚡ Username harus unik, huruf kecil, tanpa spasi!*\n`;
            teks += `*⚡ Password minimal 4 karakter!*\n`;
            teks += `*⚡ Display name bisa pakai emoji dan spasi (opsional)*\n\n`;
            teks += `*📌 Sudah punya akun? Ketik /login login [username] [password]*`;

            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            });
            break;
          }

          let username = args[0].toLowerCase();
          let password = args[1];
          let displayName = args.slice(2).join(" ") || username;

          if (displayName.includes("☑︎")) {
            await socket.sendMessage(idChat, {
              text: "*❌ Display name tidak boleh mengandung simbol ☑︎!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Validasi username
          if (username.length < 3) {
            await socket.sendMessage(idChat, {
              text: "*❌ Username minimal 3 karakter!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (username.length > 10) {
            await socket.sendMessage(idChat, {
              text: "*❌ Username maksimal 10 karakter!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!/^[a-zA-Z0-9_.]+$/.test(username)) {
            await socket.sendMessage(idChat, {
              text: "*❌ Username hanya boleh huruf, angka, underscore (_), dan titik (.)!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Validasi password
          if (!password || password.length < 4) {
            await socket.sendMessage(idChat, {
              text: "*❌ Password minimal 4 karakter!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek username sudah dipakai
          if (isUserExists(username)) {
            await socket.sendMessage(idChat, {
              text: `*❌ Username @${username} sudah dipakai!*\n📌 Coba username lain.`
            }, {
              quoted: pesan
            });
            break;
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Register user baru
          users[pengirim] = {
            username: username,
            displayName: displayName,
            password: hashedPassword,
            registeredAt: Date.now(),
            lastLogin: Date.now(),
            lastDevice: pengirim,
            bio: "",
            level: 1,
            exp: 0,
            wins: 0,
            losses: 0,
            globalId: `USER_${Date.now()}`
          };

          saveDB("./lib/database/users.json", users);

          // Inisialisasi data global
          await migrateUserData(pengirim);

          if (!globalSaldo[username] || globalSaldo[username] === 0) {
            globalSaldo[username] = 5000;
            saveDB("./lib/database/globalSaldo.json", globalSaldo);
          }

          if (!globalFishInventory[username]) {
            globalFishInventory[username] = {
              totalCasts: 0,
              totalFish: 0,
              fishList: [],
              stats: {
                basic: 0,
                rare: 0,
                legendary: 0,
                mythic: 0,
                secret: 0
              }
            };
            saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
          }

          if (!globalVillages[username]) {
            globalVillages[username] = {
              name: `Desa ${displayName}`,
              townHall: 1,
              buildings: {
                goldMine: {
                  level: 1,
                  lastCollected: Date.now()
                },
                elixirCollector: {
                  level: 1,
                  lastCollected: Date.now()
                }
              },
              resources: {
                gold: 5000,
                elixir: 5000,
                darkElixir: 0
              },
              troops: {
                barbarian: 10,
                archer: 5
              },
              shield: 0,
              trophies: 1000
            };
            saveDB("./lib/database/globalVillages.json", globalVillages);
          }

          await socket.sendMessage(idChat, {
            text: `*✅ REGISTRASI BERHASIL!* ✅\n\n*👤 Username : @${username}*\n*🔐 Password : ${password}*\n*💰 Saldo anda : Rp${(globalSaldo[username]).toLocaleString()}*\n\n*📌 SIMPAN USERNAME DAN PASSWORD ANDA!*\n*📌 Login di perangkat lain dengan : /login login ${username} [password]*\n\n*📌 Ketik /profile untuk lihat profilmu*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("LOGIN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "setpassword":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /register!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*📌 Contoh: /setpassword password123*"
            }, {
              quoted: pesan
            });
            break;
          }

          let newPassword = args[0];
          if (newPassword.length < 4) {
            await socket.sendMessage(idChat, {
              text: "*❌ Password minimal 4 karakter!*"
            }, {
              quoted: pesan
            });
            break;
          }

          const hashedPassword = await bcrypt.hash(newPassword, 10);
          users[pengirim].password = hashedPassword;
          saveDB("./lib/database/users.json", users);

          await socket.sendMessage(idChat, {
            text: `*✅ PASSWORD BERHASIL DI SET!*\n\n*🔐 Password baru : ${newPassword}*\n\n*📌 Gunakan /login login ${users[pengirim].username} [password] untuk login di perangkat lain.*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("SETPASSWORD ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal set password!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "setbio":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            let currentBio = users[pengirim].bio || "Belum ada bio";
            await socket.sendMessage(idChat, {
              text: `*📝 SET BIO* 📝\n\n*Bio saat ini : ${currentBio}*\n\n*📌 Contoh : /setbio no risk no ferrari*\n*📌 Maksimal 150 karakter*`
            }, {
              quoted: pesan
            });
            break;
          }

          let newBio = args.join(" ");

          if (newBio.length > 150) {
            await socket.sendMessage(idChat, {
              text: "*❌ Bio terlalu panjang! Maksimal 150 karakter.*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Update bio
          users[pengirim].bio = newBio;
          saveDB("./lib/database/users.json", users);

          await socket.sendMessage(idChat, {
            text: `*✅ BIO BERHASIL DIUPDATE!* ✅\n\n*📝 Bio baru : ${newBio}*\n\n*📌 Ketik /profile untuk lihat profilmu*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("SETBIO ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mengupdate bio!*\n\n*Error :* " + err.message
          }, {
            quoted: pesan
          });
        }
        break;

      case "topup":
        try {
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh: /topup kaelorix 5000*\n*📌 Contoh: /topup @user 5000*"
            }, {
              quoted: pesan
            });
            break;
          }

          let targetUsername = args[0];
          let topupAmount = parseInt(args[1]);

          let mentionTopup = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
          if (mentionTopup && users[mentionTopup]) {
            targetUsername = users[mentionTopup].username;
          }

          let targetUserId = getUserIdByUsername(targetUsername);
          if (!targetUserId) {
            await socket.sendMessage(idChat, {
              text: `*❌ Username @${targetUsername} tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          globalSaldo[targetUsername] = (globalSaldo[targetUsername] || 0) + topupAmount;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          let targetDisplay = users[targetUserId]?.displayName || targetUsername;

          await socket.sendMessage(idChat, {
            text: `*✅ TOPUP BERHASIL!*\n\n*👤 User : ${targetDisplay} (@${targetUsername})*\n*💰 Jumlah : +${topupAmount.toLocaleString()}*\n*💳 Saldo baru : Rp${(globalSaldo[targetUsername] || 0).toLocaleString()}*`
          }, {
            quoted: pesan
          });

          await socket.sendMessage(targetUserId, {
            text: `*💰 TOPUP MASUK!* 💰\n\n*👤 Dari owner*\n*💵 +${topupAmount.toLocaleString()}*\n*💳 Saldo sekarang : Rp${(globalSaldo[targetUsername] || 0).toLocaleString()}*`
          }).catch(() => {});

        } catch (err) {
          console.log("TOPUP ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal topup!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "tfsaldo":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let senderUsername = users[pengirim].username;
          let userSaldo = globalSaldo;

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh : /tfsaldo @user 5000*\n*💰 Minimal transfer : Rp1.000*"
            }, {
              quoted: pesan
            });
            break;
          }

          let transferAmount = parseInt(args[1]);
          const minTransfer = 1000;

          if (transferAmount < minTransfer) {
            await socket.sendMessage(idChat, {
              text: `*❌ MINIMAL TRANSFER RP${minTransfer.toLocaleString()}!*\n\n*💰 Anda memasukkan : Rp${transferAmount.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          // 🔥 AMBIL TARGET DARI TAG
          let targetJid = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (!targetJid) {
            await socket.sendMessage(idChat, {
              text: "*❌ TAG USER YANG INGIN DITRANSFER!*\n\n*📌 Contoh : /tfsaldo @user 5000*"
            }, {
              quoted: pesan
            });
            break;
          }

          // 🔥 CEK APAKAH TARGET SUDAH LOGIN (ADA DI DATABASE USERS)
          let targetUser = users[targetJid];

          if (!targetUser) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetJid.split("@")[0]} belum terdaftar di bot!*\n\n*📌 Suruh dia ketik /login dulu untuk mendaftar.*`
            }, {
              quoted: pesan
            });
            break;
          }

          let targetUsername = targetUser.username;
          let targetDisplay = targetUser.displayName || targetUsername;

          // Tidak bisa transfer ke diri sendiri
          if (targetJid === pengirim) {
            await socket.sendMessage(idChat, {
              text: "*❌ TIDAK BISA TRANSFER KE DIRI SENDIRI!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let senderSaldo = userSaldo[senderUsername] || 0;

          if (senderSaldo < transferAmount) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Saldo Anda : Rp${senderSaldo.toLocaleString()}*\n*📊 Transfer : Rp${transferAmount.toLocaleString()}*\n*💸 Kekurangan : Rp${(transferAmount - senderSaldo).toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Lakukan transfer
          userSaldo[senderUsername] = senderSaldo - transferAmount;
          userSaldo[targetUsername] = (userSaldo[targetUsername] || 0) + transferAmount;

          // Catat history transfer
          let transferHistory = loadDB("./lib/database/transfer.json") || {};
          transferHistory[Date.now()] = {
            from: senderUsername,
            to: targetUsername,
            fromJid: pengirim,
            toJid: targetJid,
            amount: transferAmount,
            time: Date.now()
          };

          let historyKeys = Object.keys(transferHistory);
          if (historyKeys.length > 100) {
            let hapusKeys = historyKeys.slice(0, historyKeys.length - 100);
            for (let key of hapusKeys) {
              delete transferHistory[key];
            }
          }

          saveDB("./lib/database/globalSaldo.json", userSaldo);
          saveDB("./lib/database/transfer.json", transferHistory);

          // Kirim notifikasi ke penerima
          await socket.sendMessage(targetJid, {
            text: `*💰 TRANSFER MASUK!* 💰\n\n*👤 Dari : @${senderUsername}*\n*💵 Jumlah : +Rp${transferAmount.toLocaleString()}*\n*💳 Saldo baru : Rp${(userSaldo[targetUsername] || 0).toLocaleString()}*\n*📅 Waktu : ${new Date().toLocaleString("id-ID")}*`
          }).catch(() => {});

          // Kirim konfirmasi ke pengirim
          await socket.sendMessage(idChat, {
            text: `*✅ TRANSFER BERHASIL!* ✅\n\n*👤 Kepada : ${targetDisplay} (@${targetUsername})*\n*💰 Jumlah : Rp${transferAmount.toLocaleString()}*\n*💳 Saldo Anda sekarang : Rp${userSaldo[senderUsername].toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TFSALDO ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal transfer!*\n\n*Error :* " + err.message
          }, {
            quoted: pesan
          });
        }
        break;

      case "jualfish":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userFish = globalFishInventory[username];
          let userSaldoJual = globalSaldo;

          if (!userFish || userFish.fishList.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*🎣 GAGAL!\n\n*Kamu belum punya ikan!*"
            }, {
              quoted: pesan
            });
            break;
          }

          function getFishPrice(fishName) {
            for (let level of ["basic", "rare", "legendary", "mythic", "secret"]) {
              let list = fishCatalog.fish?.[level] || [];
              let found = list.find(f => f.name.toLowerCase() === fishName.toLowerCase());
              if (found) return Math.floor((found.min + found.max) / 2);
            }
            return 0;
          }

          if (!args[0]) {
            let fishCount = {};
            let totalValue = 0;
            for (let fish of userFish.fishList) {
              fishCount[fish.name] = (fishCount[fish.name] || 0) + 1;
              totalValue += getFishPrice(fish.name);
            }
            let teks = "*🎣 JUAL IKAN 🎣*\n\n";
            teks += `*📊 Total ikan : ${userFish.totalFish}*\n`;
            teks += `*💰 Total nilai : Rp${totalValue.toLocaleString()}*\n\n`;
            for (let [name, count] of Object.entries(fishCount)) {
              teks += `• ${name} x${count}\n`;
            }
            teks += `\n*📌 Cara jual :*\n• Jual semua : /jualfish all\n• Jual semua basic : /jualfish basic\n• Jual semua rare : /jualfish rare\n• Jual jenis tertentu : /jualfish Ikan Mas 5*`;
            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            });
            break;
          }

          if (args[0].toLowerCase() === "all") {
            let total = 0;
            for (let fish of userFish.fishList) total += getFishPrice(fish.name);

            userSaldoJual[username] = (userSaldoJual[username] || 0) + total;
            globalFishInventory[username] = {
              totalCasts: userFish.totalCasts,
              totalFish: 0,
              fishList: [],
              stats: {
                basic: 0,
                rare: 0,
                legendary: 0,
                mythic: 0,
                secret: 0
              }
            };

            saveDB("./lib/database/globalSaldo.json", userSaldoJual);
            saveDB("./lib/database/globalFishInventory.json", globalFishInventory);

            await socket.sendMessage(idChat, {
              text: `*✅ SEMUA IKAN BERHASIL DIJUAL!* ✅\n\n*💰 Total : Rp${total.toLocaleString()}*\n*💳 Saldo baru : Rp${(userSaldoJual[username] || 0).toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let levelKeywords = ["basic",
            "rare",
            "legendary",
            "mythic",
            "secret"];
          let isLevelSell = levelKeywords.includes(args[0].toLowerCase());

          if (isLevelSell) {
            let targetLevel = args[0].toLowerCase();
            let levelIcon = {
              basic: "⭐",
              rare: "✨",
              legendary: "🔥",
              mythic: "👑",
              secret: "💎"
            };
            let levelName = {
              basic: "Basic",
              rare: "Rare",
              legendary: "Legendary",
              mythic: "Mythic",
              secret: "Secret"
            };

            let fishToSell = [],
            indexes = [];
            for (let i = 0; i < userFish.fishList.length; i++) {
              if (userFish.fishList[i].rarity === targetLevel) {
                fishToSell.push(userFish.fishList[i]);
                indexes.push(i);
              }
            }

            if (fishToSell.length === 0) {
              await socket.sendMessage(idChat, {
                text: `*❌ KAMU TIDAK PUNYA IKAN LEVEL ${levelName[targetLevel].toUpperCase()}!*`
              }, {
                quoted: pesan
              });
              break;
            }

            let total = 0;
            for (let fish of fishToSell) total += getFishPrice(fish.name);

            for (let i = indexes.length - 1; i >= 0; i--) {
              userFish.fishList.splice(indexes[i], 1);
              userFish.totalFish--;
              userFish.stats[fishToSell[i].rarity]--;
            }

            userSaldoJual[username] = (userSaldoJual[username] || 0) + total;

            saveDB("./lib/database/globalSaldo.json", userSaldoJual);
            saveDB("./lib/database/globalFishInventory.json", globalFishInventory);

            await socket.sendMessage(idChat, {
              text: `*✅ SEMUA IKAN ${levelName[targetLevel].toUpperCase()} BERHASIL DIJUAL!* ✅\n\n*🎣 ${levelIcon[targetLevel]} ${fishToSell.length} ekor*\n*💰 Total : Rp${total.toLocaleString()}*\n*💳 Saldo baru : Rp${(userSaldoJual[username] || 0).toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let rawArgs = [...args];
          let qty = 1;
          let last = rawArgs[rawArgs.length - 1];
          if (!isNaN(parseInt(last))) {
            qty = parseInt(last); rawArgs.pop();
          }

          let fishName = rawArgs.join(" ").toLowerCase();
          let fishToSell = [],
          indexes = [];

          for (let i = 0; i < userFish.fishList.length; i++) {
            if (userFish.fishList[i].name.toLowerCase() === fishName && fishToSell.length < qty) {
              fishToSell.push(userFish.fishList[i]);
              indexes.push(i);
            }
          }

          if (fishToSell.length === 0) {
            await socket.sendMessage(idChat, {
              text: `*❌ Kamu tidak punya ikan "${fishName}"*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (fishToSell.length < qty) {
            await socket.sendMessage(idChat, {
              text: `*❌ Ikan cuma ${fishToSell.length}, bukan ${qty}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let total = 0;
          for (let fish of fishToSell) total += getFishPrice(fish.name);

          for (let i = indexes.length - 1; i >= 0; i--) {
            userFish.fishList.splice(indexes[i], 1);
            userFish.totalFish--;
            userFish.stats[fishToSell[i].rarity]--;
          }

          userSaldoJual[username] = (userSaldoJual[username] || 0) + total;

          saveDB("./lib/database/globalSaldo.json", userSaldoJual);
          saveDB("./lib/database/globalFishInventory.json", globalFishInventory);

          let icon = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };

          await socket.sendMessage(idChat, {
            text: `*✅ BERHASIL JUAL!* ✅\n\n*🎣 ${fishToSell.length}x ${fishToSell[0].name} ${icon[fishToSell[0].rarity]}*\n*💰 Total : Rp${total.toLocaleString()}*\n*💳 Saldo baru : Rp${(userSaldoJual[username] || 0).toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("JUALFISH ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal menjual ikan. Coba lagi nanti.*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "berita":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userSaldoBerita = globalSaldo;

          const hargaberita = hargaCommand.berita || 0;
          if ((userSaldoBerita[username] || 0) < hargaberita) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargaberita.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          userSaldoBerita[username] -= hargaberita;
          saveDB("./lib/database/globalSaldo.json", userSaldoBerita);

          // React loading
          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          const response = await axios.get(
            `https://api.deline.web.id/berita/antara`,
            {
              timeout: 3600000, headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );

          const data = response.data;

          if (data && data.status === true && data.data && data.data.length > 0) {
            const berita = data.data;
            let teks = `*BERITA TERKINI - ANTARA NEWS*\n\n`;
            teks += `📅 *Update:* ${new Date().toLocaleDateString("id-ID", {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}\n`;
            teks += `*Total berita:* ${berita.length}\n\n`;
            teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;

            let no = 1;
            for (const item of berita) {
              teks += `*${no}. ${item.title}*\n`;
              teks += `*Kategori:* ${item.category}\n`;
              teks += `*Link:* ${item.link}\n`;
              teks += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;
              no++;
            }

            teks += `*_📌 Klik link di atas untuk membaca berita lengkap_*\n`;
            teks += `*_📰 Sumber: Antara News_*`;

            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            });

          } else {
            await socket.sendMessage(idChat, {
              text: "*❌ Gagal mengambil berita. Silakan coba lagi nanti.*"
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }

        } catch (err) {
          console.log("BERITA ERROR:", err.message);
          let errorMsg = "*❌ Error Mengambil Berita:*\n\n";
          if (err.code === "ECONNABORTED") errorMsg += "Waktu koneksi habis. Silakan coba lagi.";
          else if (err.response?.status === 404) errorMsg += "Endpoint API tidak ditemukan.";
          else if (err.response?.status === 500) errorMsg += "Server API mengalami masalah. Coba lagi nanti.";
          else if (err.message?.includes("ECONNREFUSED")) errorMsg += "Gagal terhubung ke server API.";
          else errorMsg += `Gagal: ${err.message}`;

          await socket.sendMessage(idChat, {
            text: errorMsg
          }, {
            quoted: pesan
          });
          await socket.sendMessage(idChat, {
            react: {
              text: '❌', key: pesan.key
            }
          });
        }
        break;

      case "ytmp3":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userSaldoYtmp3 = globalSaldo;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /ytmp3 https://youtube.com/watch?v=ADj0demAF-o*"
            }, {
              quoted: pesan
            });
            break;
          }

          const hargaytmp3 = hargaCommand.ytmp3 || 0;
          if ((userSaldoYtmp3[username] || 0) < hargaytmp3) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargaytmp3.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          userSaldoYtmp3[username] -= hargaytmp3;
          saveDB("./lib/database/globalSaldo.json", userSaldoYtmp3);

          const ytUrl = args[0];

          if (!ytUrl.includes("youtube.com") && !ytUrl.includes("youtu.be")) {
            await socket.sendMessage(idChat, {
              text: "*Link tidak valid!*\n*Masukkan URL YouTube yang benar.*"
            }, {
              quoted: pesan
            });
            break;
          }

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          const response = await axios.get(
            `https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(ytUrl)}`,
            {
              timeout: 3600000, headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );

          const data = response.data;

          if (data && data.status === true && data.result && data.result.mp3) {
            const result = data.result;

            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: '*Mengirim audio...*'
            }, {
              quoted: pesan
            });

            await socket.sendMessage(idChat, {
              audio: {
                url: result.mp3
              },
              mimetype: "audio/mpeg",
              fileName: `${result.title}.mp3`
            }, {
              quoted: pesan
            });

          } else {
            await socket.sendMessage(idChat, {
              text: "*Error! Gagal mengambil audio dari YouTube*"
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }

        } catch (err) {
          console.log("YTMP3 ERROR:", err.message);
          let errorMsg = "*❌ Error YouTube MP3 Downloader:*\n\n";
          if (err.code === "ECONNABORTED") errorMsg += "Waktu koneksi habis. Silakan coba lagi.";
          else if (err.response?.status === 404) errorMsg += "Endpoint API tidak ditemukan.";
          else if (err.response?.status === 500) errorMsg += "Server API mengalami masalah. Coba lagi nanti.";
          else errorMsg += `Gagal: ${err.message}`;

          await socket.sendMessage(idChat, {
            text: errorMsg
          }, {
            quoted: pesan
          });
          await socket.sendMessage(idChat, {
            react: {
              text: '❌', key: pesan.key
            }
          });
        }
        break;

      case "ytmp4":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userSaldoYtmp4 = globalSaldo;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /ytmp4 https://youtube.com/watch?v=ADj0demAF-o*"
            }, {
              quoted: pesan
            });
            break;
          }

          const hargaytmp4 = hargaCommand.ytmp4 || 0;
          if ((userSaldoYtmp4[username] || 0) < hargaytmp4) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargaytmp4.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          userSaldoYtmp4[username] -= hargaytmp4;
          saveDB("./lib/database/globalSaldo.json", userSaldoYtmp4);

          const ytVideoUrl = args[0];

          if (!ytVideoUrl.includes("youtube.com") && !ytVideoUrl.includes("youtu.be")) {
            await socket.sendMessage(idChat, {
              text: "*Link tidak valid!*\n*Masukkan URL YouTube yang benar.*"
            }, {
              quoted: pesan
            });
            break;
          }

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          const response = await axios.get(
            `https://api-faa.my.id/faa/ytmp4?url=${encodeURIComponent(ytVideoUrl)}`,
            {
              timeout: 3600000, headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );

          const data = response.data;

          if (data && data.status === true && data.result && data.result.download_url) {
            const result = data.result;

            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });
            await socket.sendMessage(idChat, {
              text: '*Mengirim video...*'
            }, {
              quoted: pesan
            });

            await socket.sendMessage(idChat, {
              video: {
                url: result.download_url
              },
              mimetype: "video/mp4",
              caption: `🎬 *YouTube Downloader*\n\n*✅ Berhasil diunduh*\n*📁 Format: ${result.format.toUpperCase()}*`
            }, {
              quoted: pesan
            });

          } else {
            await socket.sendMessage(idChat, {
              text: "*Error! Gagal mengambil video dari YouTube*"
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }

        } catch (err) {
          console.log("YTMP4 ERROR:", err.message);
          let errorMsg = "*❌ Error YouTube MP4 Downloader:*\n\n";
          if (err.code === "ECONNABORTED") errorMsg += "Waktu koneksi habis. Silakan coba lagi.";
          else if (err.response?.status === 404) errorMsg += "Endpoint API tidak ditemukan.";
          else if (err.response?.status === 500) errorMsg += "Server API mengalami masalah. Coba lagi nanti.";
          else errorMsg += `Gagal: ${err.message}`;

          await socket.sendMessage(idChat, {
            text: errorMsg
          }, {
            quoted: pesan
          });
          await socket.sendMessage(idChat, {
            react: {
              text: '❌', key: pesan.key
            }
          });
        }
        break;
        // ===================== COMMAND EMAS =====================
      case "cek":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let aset = args[0] ? args[0].toUpperCase(): null;

          if (!aset) {
            await socket.sendMessage(idChat, {
              text: "*❌ /cek [aset]*\n*📌 Contoh: /cek BTC atau /cek ETH*"
            }, {
              quoted: pesan
            });
            break;
          }

          let assetData = null;
          let userAsset = null;
          let jumlah = 0;
          let totalInvest = 0;
          let history = [];
          let icon = "";
          let name = "";

          if (aset === "EMAS") {
            assetData = {
              currentPrice: hargaEmas,
              minBuy: 10000,
              tax: 0.02,
              icon: "🪙",
              name: "Emas"
            };
            userAsset = globalEmas[username];
            jumlah = userAsset?.gram || 0;
            totalInvest = userAsset?.totalInvest || 0;
            history = userAsset?.history || [];
            icon = "🪙";
            name = "Emas";
          } else if (aset === "BTC") {
            assetData = {
              currentPrice: hargaBitcoin,
              minBuy: 100000,
              tax: 0.02,
              icon: "₿",
              name: "Bitcoin"
            };
            userAsset = globalBtc[username];
            jumlah = userAsset?.jumlah || 0;
            totalInvest = userAsset?.totalInvest || 0;
            history = userAsset?.history || [];
            icon = "₿";
            name = "Bitcoin";
          } else {
            assetData = cryptoData.assets[aset];
            if (!assetData) {
              await socket.sendMessage(idChat, {
                text: `*❌ Aset "${aset}" tidak ditemukan!*`
              }, {
                quoted: pesan
              });
              break;
            }
            userAsset = cryptoUserData.users[username]?.[aset];
            jumlah = userAsset?.jumlah || 0;
            totalInvest = userAsset?.totalInvest || 0;
            history = userAsset?.history || [];
            icon = assetData.icon;
            name = assetData.name;
          }

          if (jumlah === 0) {
            await socket.sendMessage(idChat, {
              text: `*${icon} INFORMASI ${name}*\n\n*❌ Anda belum memiliki ${name}*\n*💰 Saldo Anda : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n*📌 Ketik /beli ${aset} (jumlah) untuk membeli*\n*📌 Harga saat ini : Rp${assetData.currentPrice.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let nilaiSaatIni = jumlah * assetData.currentPrice;
          let keuntungan = nilaiSaatIni - totalInvest;
          let persenUntung = totalInvest > 0 ? (keuntungan / totalInvest * 100).toFixed(2): 0;

          let historyText = "";
          let lastHistory = history.slice(0, 5);
          for (let h of lastHistory) {
            if (h.type === "BELI") {
              let jumlahBeli = h.gram || h.btc || h.amount || 0;
              historyText += `• *BELI ${jumlahBeli} ${aset} @ Rp${h.price.toLocaleString()} = Rp${h.amount?.toLocaleString() || h.nominal?.toLocaleString()}*\n`;
            } else {
              let jumlahJual = h.gram || h.btc || h.amount || 0;
              historyText += `• *JUAL ${jumlahJual} ${aset} @ Rp${h.price.toLocaleString()} | Bersih : Rp${Math.floor(h.net).toLocaleString()}*\n`;
            }
          }

          await socket.sendMessage(idChat, {
            text: `*${icon} PORTFOLIO ${name}* ${icon}\n\n*📦 Total ${aset} : ${jumlah.toLocaleString(undefined, {
              minimumFractionDigits: 4, maximumFractionDigits: 8
            })} ${aset}*\n*💰 Nilai saat ini : Rp${Math.floor(nilaiSaatIni).toLocaleString()}*\n*📊 Total investasi : Rp${totalInvest.toLocaleString()}*\n*📈 Keuntungan : ${keuntungan >= 0 ? "+": ""}Rp${Math.floor(keuntungan).toLocaleString()} (${persenUntung}%)*\n*💳 Saldo anda : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n*📜 HISTORY (5 terakhir) :*\n${historyText || "Belum ada history"}\n\n*📌 Harga saat ini : Rp${assetData.currentPrice.toLocaleString()}*\n*📌 Harga update tiap 1 menit!*\n*📌 Ketik /beli ${aset} (jumlah) atau /jual ${aset} (jumlah)*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CEK ASET ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal cek portfolio!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "beli":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: `*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh : /beli BTC 100000*\n*📌 Contoh : /beli EMAS 50000*\n*📌 Contoh : /beli ETH 100000*`
            }, {
              quoted: pesan
            });
            break;
          }

          let aset = args[0].toUpperCase();
          let nominal = parseInt(args[1]);

          let assetData = null;
          let minBuy = 0;
          let icon = "";
          let name = "";

          if (aset === "EMAS") {
            assetData = {
              currentPrice: hargaEmas,
              minBuy: 10000,
              tax: 0.02
            };
            minBuy = 10000;
            icon = "🪙";
            name = "Emas";
          } else if (aset === "BTC") {
            assetData = {
              currentPrice: hargaBitcoin,
              minBuy: 100000,
              tax: 0.02
            };
            minBuy = 100000;
            icon = "₿";
            name = "Bitcoin";
          } else {
            assetData = cryptoData.assets[aset];
            if (!assetData) {
              await socket.sendMessage(idChat, {
                text: `*❌ Aset "${aset}" tidak ditemukan!*`
              }, {
                quoted: pesan
              });
              break;
            }
            minBuy = assetData.minBuy;
            icon = assetData.icon;
            name = assetData.name;
          }

          if (nominal < minBuy) {
            await socket.sendMessage(idChat, {
              text: `*❌ MINIMAL BELI RP${minBuy.toLocaleString()}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if ((globalSaldo[username] || 0) < nominal) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Saldo Anda : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n*📊 Butuh : Rp${nominal.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let amount = nominal / assetData.currentPrice;
          let roundedAmount = Math.floor(amount * 10000000) / 10000000;

          // Cek stok BTC
          if (aset === "BTC" && roundedAmount > jumlahBtc.totalStock) {
            await socket.sendMessage(idChat, {
              text: `*❌ STOK BTC TIDAK CUKUP!*\n\n*📦 Stok tersisa : ${jumlahBtc.totalStock} BTC*\n*📊 Anda ingin beli : ${roundedAmount} BTC*`
            }, {
              quoted: pesan
            });
            break;
          }

          globalSaldo[username] -= nominal;

          if (aset === "EMAS") {
            if (!globalEmas[username]) globalEmas[username] = {
              gram: 0,
              totalInvest: 0,
              history: []
            };
            globalEmas[username].gram += roundedAmount;
            globalEmas[username].totalInvest += nominal;
            globalEmas[username].history.unshift({
              type: "BELI", amount: nominal, gram: roundedAmount, price: assetData.currentPrice, time: Date.now()
            });
            saveDB("./lib/database/emas.json", globalEmas);
          } else if (aset === "BTC") {
            if (!globalBtc[username]) globalBtc[username] = {
              jumlah: 0,
              totalInvest: 0,
              history: []
            };
            globalBtc[username].jumlah += roundedAmount;
            globalBtc[username].totalInvest += nominal;
            globalBtc[username].history.unshift({
              type: "BELI", amount: nominal, btc: roundedAmount, price: assetData.currentPrice, time: Date.now()
            });
            saveDB("./lib/database/btc.json", globalBtc);
            jumlahBtc.totalStock -= roundedAmount;
            saveDB("./lib/database/globalBtc.json", jumlahBtc);
          } else {
            if (!cryptoUserData.users[username]) cryptoUserData.users[username] = {};
            if (!cryptoUserData.users[username][aset]) {
              cryptoUserData.users[username][aset] = {
                jumlah: 0,
                totalInvest: 0,
                history: []
              };
            }
            cryptoUserData.users[username][aset].jumlah += roundedAmount;
            cryptoUserData.users[username][aset].totalInvest += nominal;
            cryptoUserData.users[username][aset].history.unshift({
              type: "BELI", nominal: nominal, amount: roundedAmount, price: assetData.currentPrice, time: Date.now()
            });
            saveDB("./lib/database/cryptoUserData.json", cryptoUserData);
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          let totalJumlah = roundedAmount;
          if (aset === "EMAS") totalJumlah = globalEmas[username].gram;
          else if (aset === "BTC") totalJumlah = globalBtc[username].jumlah;
          else totalJumlah = cryptoUserData.users[username][aset].jumlah;

          await socket.sendMessage(idChat, {
            text: `*✅ PEMBELIAN ${name} BERHASIL!*\n\n*💰 Dana : Rp${nominal.toLocaleString()}*\n*${icon} Jumlah : ${roundedAmount} ${aset}*\n*💳 Sisa saldo : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n*📦 Total ${aset} : ${totalJumlah.toLocaleString()} ${aset}*\n\n*📌 Harga 1 ${aset} saat ini : Rp${assetData.currentPrice.toLocaleString()}*\n*📌 Harga update tiap 1 menit!*\n*📌 Ketik /jual ${aset} untuk menjual*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BELI ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal membeli!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "scpin":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /scpin Raizel*\n*Contoh: /scpin bunga*"
            }, {
              quoted: pesan
            });
            break;
          }
          let username = users[pengirim].username;
          const hargascpin = hargaCommand.scpin || 0;
          if ((globalSaldo[username] || 0) < hargascpin) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargascpin.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[pengirim] -= hargascpin;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          const searchQueryPin = args.join(" ");

          // React loading
          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          try {
            // Panggil API search Pinterest
            const response = await axios.get(
              `https://api.deline.web.id/search/pinterest?q=${encodeURIComponent(searchQueryPin)}`,
              {
                timeout: 3600000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              }
            );

            const data = response.data;

            if (data && data.status === true && data.data && data.data.length > 0) {
              const results = data.data.slice(0, 10); // Maksimal 10 hasil
              // React sukses
              await socket.sendMessage(idChat, {
                react: {
                  text: '✅', key: pesan.key
                }
              });
              let teks = `🔍 *HASIL PENCARIAN PINTEREST*\n\n`;
              teks += `📌 *Kata kunci : ${searchQueryPin}*\n`;
              teks += `📊 *Total ditemukan : ${data.data.length} gambar*\n\n`;
              teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;

              let no = 1;
              for (const pin of results) {
                teks += `*${no}. ${pin.caption || "Tanpa caption"}*\n`;
                teks += `👤 *Uploader : ${pin.fullname || pin.uploader}*\n`;
                teks += `👥 *Followers : ${pin.followers?.toLocaleString() || "?"}*\n`;
                teks += `🔗 *Link : ${pin.source}*\n`;
                teks += `\n*━━━━━━━━━━━━━━━━━━━━*\n\n`;
                no++;
              }

              teks += `_*📌 Kirim ${prefix}pindl (link) untuk download gambar*_\n`;
              teks += `_*Contoh: ${prefix}pindl ${results[0]?.source}*_`;


              await socket.sendMessage(idChat, {
                text: teks,
                contextInfo: {
                  externalAdReply: {
                    title: "SEARCH PINTEREST",
                    body: "Pinterest Image Finder",
                    thumbnailUrl: results[0]?.image || randomThumb(),
                    sourceUrl: "https://pinterest.com",
                    mediaType: 1,
                    renderLargerThumbnail: true
                  }
                }
              }, {
                quoted: pesan
              });

              // Kirim 5 gambar pertama sebagai preview
              let previewCount = Math.min(5, results.length);
              for (let i = 0; i < previewCount; i++) {
                await socket.sendMessage(idChat, {
                  image: {
                    url: results[i].image
                  },
                  caption: `🖼️ *Hasil ${i+1}*\n📝 ${results[i].caption || "Tanpa caption"}\n👤 ${results[i].fullname || results[i].uploader}`
                }, {
                  quoted: pesan
                });
                await delay(1000); // delay antar gambar
              }


            } else {
              await socket.sendMessage(idChat, {
                text: `*❌ Tidak ditemukan gambar Pinterest dengan kata kunci:*\n*"${searchQueryPin}"*\n\n📌 Coba gunakan kata kunci lain yang lebih spesifik.`
              }, {
                quoted: pesan
              });
              await socket.sendMessage(idChat, {
                react: {
                  text: '❌', key: pesan.key
                }
              });
            }

          } catch (err) {
            console.log("SCPIN ERROR:", err.message);

            let errorMsg = "*❌ Error Search Pinterest:*\n\n";

            if (err.code === "ECONNABORTED") {
              errorMsg += "Waktu koneksi habis. Silakan coba lagi.";
            } else if (err.response?.status === 404) {
              errorMsg += "Endpoint API tidak ditemukan.";
            } else if (err.response?.status === 500) {
              errorMsg += "Server API mengalami masalah. Coba lagi nanti.";
            } else {
              errorMsg += `Gagal: ${err.message}`;
            }

            await socket.sendMessage(idChat, {
              text: errorMsg
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "iqc":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Penggunaan Salah!*\n*Contoh: /iqc amel cantik*"
            }, {
              quoted: pesan
            });
            break;
          }
          let username = users[pengirim].username;
          const hargaiqc = hargaCommand.iqc || 0;
          if ((globalSaldo[username] || 0) < hargaiqc) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargaiqc.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargaiqc;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          const textIQC = args.join(" ");

          // Dapatkan waktu real-time dalam WIB (GMT+7)
          const nowWIB = new Date();
          // Mengatur waktu ke GMT+7 (WIB)
          const wibTime = new Date(nowWIB.toLocaleString("en-US", {
            timeZone: "Asia/Jakarta"
          }));
          const hours = wibTime.getHours().toString().padStart(2, '0');
          const minutes = wibTime.getMinutes().toString().padStart(2, '0');
          const currentTime = `${hours}:${minutes}`;

          // Waktu untuk status bar dan chat
          const statusBarTime = currentTime;
          const chatTime = currentTime;

          // React loading
          await socket.sendMessage(idChat, {
            react: {
              text: '🕖', key: pesan.key
            }
          });

          try {
            // Panggil API dengan waktu real-time WIB
            const response = await axios.get(
              `https://api.deline.web.id/maker/iqc?text=${encodeURIComponent(textIQC)}&chatTime=${encodeURIComponent(chatTime)}&statusBarTime=${encodeURIComponent(statusBarTime)}`,
              {
                responseType: 'arraybuffer',
                timeout: 3600000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              }
            );

            // Konversi ke buffer gambar
            const imageBuffer = Buffer.from(response.data);

            // Kirim gambar
            await socket.sendMessage(idChat, {
              image: imageBuffer
            }, {
              quoted: pesan
            });

            // React sukses
            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });

          } catch (err) {
            console.log("IQC ERROR:", err.message);

            let errorMsg = "*❌ Error IQC Maker:*\n\n";

            if (err.code === "ECONNABORTED") {
              errorMsg += "Waktu koneksi habis. Silakan coba lagi.";
            } else if (err.response?.status === 404) {
              errorMsg += "Endpoint API tidak ditemukan.";
            } else if (err.response?.status === 500) {
              errorMsg += "Server API mengalami masalah. Coba lagi nanti.";
            } else {
              errorMsg += `Gagal terhubung: ${err.message}`;
            }

            await socket.sendMessage(idChat, {
              text: errorMsg
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "brat":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*Isi teksnya bang*\n\n*Contoh: /brat keren banget guaaa*"
            }, {
              quoted: pesan
            });
            break;
          }
          const hargabrat = hargaCommand.brat || 0;
          let username = users[pengirim].username;
          if ((globalSaldo[username] || 0) < hargabrat) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargabrat.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargabrat;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          const bratText = args.join(" ").trim();

          // React loading dengan emoji jam dinding
          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          try {
            // Download gambar dari API (timeout 2 menit = 120000 ms)
            const response = await axios.get(
              `https://api.deline.web.id/maker/brat?text=${encodeURIComponent(bratText)}`,
              {
                responseType: 'arraybuffer',
                timeout: 3600000
              }
            );

            // Konversi gambar ke stiker dengan sharp
            const stickerBuffer = await sharp(Buffer.from(response.data))
            .resize(512, 512, {
              fit: 'contain',
              background: {
                r: 0, g: 0, b: 0, alpha: 0
              }
            })
            .webp({
              quality: 50
            })
            .toBuffer();

            // Kirim stiker
            await socket.sendMessage(idChat, {
              sticker: stickerBuffer
            }, {
              quoted: pesan
            });

            // React sukses
            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });

          } catch (err) {
            console.log("BRAT ERROR:", err.message);

            let errorMsg = "*❌ Error BRAT Sticker Maker:*\n\n";

            if (err.code === "ECONNABORTED") {
              errorMsg += "Waktu koneksi habis (2 menit). Silakan coba lagi.";
            } else if (err.response?.status === 404) {
              errorMsg += "Endpoint API tidak ditemukan.";
            } else if (err.response?.status === 500) {
              errorMsg += "Server API mengalami masalah. Coba lagi nanti.";
            } else {
              errorMsg += `Gagal: ${err.message}`;
            }

            await socket.sendMessage(idChat, {
              text: errorMsg
            }, {
              quoted: pesan
            });
            await socket.sendMessage(idChat, {
              react: {
                text: '❌', key: pesan.key
              }
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;

      case "scgc":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          if (!query) {
            await socket.sendMessage(idChat, {
              text: '*Contoh: /scgc ML indonesia*\n*Contoh : /scgc jual beli*'
            }, {
              quoted: pesan
            });
            break;
          }
          const hargascgc = hargaCommand.scgc || 0;
          if ((globalSaldo[username] || 0) < hargascgc) {
            return socket.sendMessage(idChat, {
              text: `❌ Saldo kurang! Butuh Rp${hargascgc.toLocaleString()}`
            }, {
              quoted: pesan
            });
          }
          globalSaldo[username] -= hargascgc;
          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          await socket.sendMessage(idChat, {
            react: {
              text: '🕐', key: pesan.key
            }
          });

          try {
            const res = await axios.get(`https://api.deline.web.id/search/grubwa?q=${encodeURIComponent(query)}`);
            const data = res.data;

            if (!data.status || data.total === 0) {
              await socket.sendMessage(idChat, {
                text: `*❌ Grup dengan kata kunci "${query}" nggak ketemu*`
              }, {
                quoted: pesan
              });
              await socket.sendMessage(idChat, {
                react: {
                  text: '❌', key: pesan.key
                }
              });
              break;
            }

            let teks = `*✅ Ketemu ${data.total} grup buat "${query}"*\n\n`;

            data.result.slice(0, 10).forEach((grup, i) => {
              teks += `*${i + 1}. ${grup.Name}*\n`;
              teks += `*Link : ${grup.Link}*\n`;
              teks += `*Desc :* ${grup.Description || 'Nggak ada deskripsi'}\n\n`;
            });

            if (data.total > 20) teks += `*+ ${data.total - 20} grup lainnya nggak ditampilin biar nggak spam*`;

            await socket.sendMessage(idChat, {
              react: {
                text: '✅', key: pesan.key
              }
            });

            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            });

          } catch (err) {
            console.log("SCGC ERROR:", err.message);
            await socket.sendMessage(idChat, {
              text: '*Error pas nyari grup. API-nya lagi down kayaknya*'
            }, {
              quoted: pesan
            });
          }} catch (err) {
          console.log("Error : ", err)
        }
        break;
        // ===================== COMMAND SAHAM (50+ PERUSAHAAN) =====================

      case "listsaham":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let page = parseInt(args[0]) || 1;
          let itemsPerPage = 15;
          let stocksArray = Object.entries(globalSaham.stocks);
          let totalPages = Math.ceil(stocksArray.length / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages) page = totalPages;

          let startIdx = (page - 1) * itemsPerPage;
          let endIdx = startIdx + itemsPerPage;
          let pageStocks = stocksArray.slice(startIdx, endIdx);

          // Kelompokkan berdasarkan sektor
          let sectors = {};
          for (let [kode, stock] of pageStocks) {
            if (!sectors[stock.sector]) sectors[stock.sector] = [];
            sectors[stock.sector].push({
              kode, stock
            });
          }

          let teks = `*📊 DAFTAR SAHAM (${stocksArray.length} Perusahaan)* 📊\n\n`;
          teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━━━━━*\n\n`;

          for (let [sector, stocks] of Object.entries(sectors)) {
            teks += `*📁 ${sector}*\n`;
            for (let item of stocks) {
              let change = ((item.stock.currentPrice - item.stock.initialPrice) / item.stock.initialPrice * 100).toFixed(2);
              let changeIcon = change >= 0 ? "📈": "📉";
              teks += `   *${item.stock.icon} ${item.kode} - ${item.stock.name}*\n`;
              teks += `      *💰 Rp${item.stock.currentPrice.toLocaleString()} ${changeIcon} ${change}%*\n`;
            }
            teks += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          }

          if (totalPages > 1) {
            teks += `*📌 Navigasi:*\n`;
            if (page > 1) teks += `• */listsaham ${page - 1} - Halaman sebelumnya*\n`;
            if (page < totalPages) teks += `• */listsaham ${page + 1} - Halaman berikutnya*\n`;
            teks += `\n`;
          }

          teks += `*📌 Cara beli : /belisaham [kode] [lot]*\n`;
          teks += `*📌 1 lot = 100 saham*\n`;
          teks += `*📌 Minimal beli 1 lot*\n\n`;
          teks += `*_© 2026 Kaelorix. All Right Reserved_*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("LISTSAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan daftar saham!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "belisaham":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh: /belisaham BBCA 5*\n*📌 1 lot = 100 lembar*\n*📌 Minimal beli 1 lot*\n*📌 Cek /listsaham untuk lihat harga*"
            }, {
              quoted: pesan
            });
            break;
          }

          let kode = args[0].toUpperCase();
          let lot = parseInt(args[1]);

          if (lot < 1) {
            await socket.sendMessage(idChat, {
              text: "*❌ Minimal beli 1 lot!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let stock = globalSaham.stocks[kode];
          if (!stock) {
            await socket.sendMessage(idChat, {
              text: `*❌ Kode saham "${kode}" tidak ditemukan!*\n*📌 Cek /listsaham untuk daftar lengkap*`
            }, {
              quoted: pesan
            });
            break;
          }

          let jumlahSaham = lot * 100;
          let totalBiaya = stock.currentPrice * jumlahSaham;
          const minInvest = 10000;

          if (totalBiaya < minInvest) {
            await socket.sendMessage(idChat, {
              text: `*❌ Minimal investasi Rp${minInvest.toLocaleString()}!*\n*💰 Total biaya : Rp${totalBiaya.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          if ((globalSaldo[username] || 0) < totalBiaya) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Saldo Anda : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n*📊 Butuh : Rp${totalBiaya.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Inisialisasi user stock portfolio
          if (!globalSaham.users[username]) {
            globalSaham.users[username] = {
              portfolio: {},
              totalInvest: 0,
              history: []
            };
          }
          if (!globalSaham.users[username].portfolio[kode]) {
            globalSaham.users[username].portfolio[kode] = {
              lot: 0,
              saham: 0,
              avgPrice: 0,
              totalInvest: 0
            };
          }

          let userStock = globalSaham.users[username].portfolio[kode];
          let totalSahamBaru = userStock.saham + jumlahSaham;
          let totalBiayaBaru = userStock.totalInvest + totalBiaya;
          let avgPriceBaru = totalSahamBaru > 0 ? totalBiayaBaru / totalSahamBaru: 0;

          // Kurangi saldo user
          globalSaldo[username] -= totalBiaya;

          // ✅ CEK APAKAH SAHAM PERUSAHAAN USER (bukan saham sistem)
          let isCompanyStock = stock.type === "company" || globalSaham.companyStocks[kode];

          if (isCompanyStock) {
            let company = globalSaham.companyStocks[kode];
            if (company) {
              // Uang masuk ke KAS PERUSAHAAN
              company.companyData.cash = (company.companyData.cash || 0) + totalBiaya;

              // Catat history perusahaan
              company.companyData.history = company.companyData.history || [];
              company.companyData.history.unshift({
                time: Date.now(),
                type: "PENJUALAN_SAHAM",
                buyer: username,
                lot: lot,
                saham: jumlahSaham,
                price: stock.currentPrice,
                total: totalBiaya
              });

              // Update shareholder perusahaan
              if (!company.shareholders) company.shareholders = {};
              company.shareholders[username] = (company.shareholders[username] || 0) + jumlahSaham;
            }
          }

          // Update portfolio user
          userStock.lot += lot;
          userStock.saham += jumlahSaham;
          userStock.avgPrice = avgPriceBaru;
          userStock.totalInvest = totalBiayaBaru;
          globalSaham.users[username].totalInvest += totalBiaya;

          // Catat history user
          globalSaham.users[username].history.unshift({
            type: "BELI", kode: kode, lot: lot, saham: jumlahSaham,
            price: stock.currentPrice, total: totalBiaya, time: Date.now()
          });

          if (globalSaham.users[username].history.length > 50) {
            globalSaham.users[username].history.pop();
          }

          // Update volume saham yang tersedia untuk publik
          if (stock.availableShares && stock.availableShares >= jumlahSaham) {
            stock.availableShares -= jumlahSaham;
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          let change = ((stock.currentPrice - stock.initialPrice) / stock.initialPrice * 100).toFixed(2);
          let changeIcon = change >= 0 ? "📈": "📉";

          let companyText = "";
          if (isCompanyStock) {
            let company = globalSaham.companyStocks[kode];
            if (company) {
              companyText = `\n*🏢 Uang masuk ke kas perusahaan ${company.name}*\n`;
            }
          }

          await socket.sendMessage(idChat, {
            text: `*✅ PEMBELIAN SAHAM BERHASIL!* ✅\n\n` +
            `${stock.icon} *${kode} - ${stock.name}*\n` +
            `*📦 ${lot} lot (${jumlahSaham.toLocaleString()} lembar)*\n` +
            `*💰 Harga : Rp${stock.currentPrice.toLocaleString()}/lembar*\n` +
            `*💎 Total : Rp${totalBiaya.toLocaleString()}*\n` +
            `*📊 Rata-rata: Rp${Math.floor(avgPriceBaru).toLocaleString()}/lembar*\n\n` +
            `*💳 Sisa saldo : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n` +
            `*📈 Total saham ${kode}: ${userStock.lot} lot (${userStock.saham.toLocaleString()} lembar)*${companyText}\n\n` +
            `*${changeIcon} Harga ${stock.icon} ${kode}: Rp${stock.currentPrice.toLocaleString()} (${changeIcon} ${Math.abs(change)}%)*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BELISAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal membeli saham!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "jualsaham":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh: /juallaham BBCA 2*\n*📌 Contoh: /juallaham BBCA all*\n*📌 Cek portfolio dengan /ceksaham*"
            }, {
              quoted: pesan
            });
            break;
          }

          let kode = args[0].toUpperCase();
          let stock = globalSaham.stocks[kode];

          if (!stock) {
            await socket.sendMessage(idChat, {
              text: `*❌ Kode saham "${kode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (!globalSaham.users[username] || !globalSaham.users[username].portfolio[kode] || globalSaham.users[username].portfolio[kode].lot === 0) {
            await socket.sendMessage(idChat, {
              text: `*❌ Anda tidak memiliki saham ${stock.icon} ${kode}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let userStock = globalSaham.users[username].portfolio[kode];
          let lotJual = 0;

          if (args[1] && args[1].toLowerCase() === "all") {
            lotJual = userStock.lot;
          } else if (args[1] && !isNaN(args[1])) {
            lotJual = parseInt(args[1]);
          } else {
            await socket.sendMessage(idChat, {
              text: "*❌ Masukkan jumlah lot yang valid!*\n*📌 Contoh: /juallaham BBCA 2*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (lotJual < 1) {
            await socket.sendMessage(idChat, {
              text: "*❌ Minimal jual 1 lot!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (lotJual > userStock.lot) {
            await socket.sendMessage(idChat, {
              text: `*❌ Lot tidak cukup!*\n*📊 Anda memiliki: ${userStock.lot} lot*`
            }, {
              quoted: pesan
            });
            break;
          }

          let jumlahSahamJual = lotJual * 100;
          let nilaiKotor = stock.currentPrice * jumlahSahamJual;
          const pajak = 0.003; // 0.3% pajak transaksi
          let pajakAmount = Math.floor(nilaiKotor * pajak);
          let nilaiBersih = nilaiKotor - pajakAmount;

          // Hitung keuntungan
          let proporsiJual = jumlahSahamJual / userStock.saham;
          let modalJual = userStock.totalInvest * proporsiJual;
          let keuntungan = nilaiBersih - modalJual;

          // Update portfolio
          let sisaLot = userStock.lot - lotJual;
          let sisaSaham = userStock.saham - jumlahSahamJual;

          if (sisaLot === 0) {
            delete globalSaham.users[username].portfolio[kode];
          } else {
            let sisaInvest = userStock.totalInvest - modalJual;
            userStock.lot = sisaLot;
            userStock.saham = sisaSaham;
            userStock.totalInvest = sisaInvest;
            userStock.avgPrice = sisaSaham > 0 ? sisaInvest / sisaSaham: 0;
          }

          // Tambah saldo
          globalSaldo[username] = (globalSaldo[username] || 0) + nilaiBersih;
          globalSaham.users[username].totalInvest -= modalJual;

          // Catat history
          if (!globalSaham.users[username].history) globalSaham.users[username].history = [];
          globalSaham.users[username].history.unshift({
            type: "JUAL", kode: kode, lot: lotJual, saham: jumlahSahamJual,
            price: stock.currentPrice, gross: nilaiKotor, tax: pajakAmount,
            net: nilaiBersih, profit: keuntungan, time: Date.now()
          });

          if (globalSaham.users[username].history.length > 50) {
            globalSaham.users[username].history.pop();
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          let profitIcon = keuntungan >= 0 ? "📈 +": "📉 ";

          await socket.sendMessage(idChat, {
            text: `*✅ PENJUALAN SAHAM BERHASIL!* ✅\n\n` +
            `${stock.icon} *${kode} - ${stock.name}*\n` +
            `*📦 ${lotJual} lot (${jumlahSahamJual.toLocaleString()} saham)*\n` +
            `*💰 Harga jual: Rp${stock.currentPrice.toLocaleString()}/saham*\n` +
            `*💵 Nilai kotor: Rp${nilaiKotor.toLocaleString()}*\n` +
            `*📉 Pajak (0.3%): Rp${pajakAmount.toLocaleString()}*\n` +
            `*💳 Nilai bersih: Rp${nilaiBersih.toLocaleString()}*\n` +
            `*${profitIcon} Keuntungan: Rp${Math.abs(keuntungan).toLocaleString()}*\n\n` +
            `*💳 Saldo baru: Rp${(globalSaldo[username] || 0).toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("JUALSAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menjual saham!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "ceksaham":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let targetKode = args[0] ? args[0].toUpperCase(): null;

          if (!globalSaham.users[username] || Object.keys(globalSaham.users[username].portfolio).length === 0) {
            await socket.sendMessage(idChat, {
              text: `*📊 PORTFOLIO SAHAM*\n\n*❌ Anda belum memiliki saham!*\n*💰 Saldo anda : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n*📌 Beli saham dengan /belisaham [kode] [lot]*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (targetKode && globalSaham.stocks[targetKode]) {
            let stock = globalSaham.stocks[targetKode];
            let userStock = globalSaham.users[username].portfolio[targetKode];

            if (!userStock || userStock.lot === 0) {
              await socket.sendMessage(idChat, {
                text: `*❌ Anda tidak memiliki saham ${stock.icon} ${targetKode}!*`
              }, {
                quoted: pesan
              });
              break;
            }

            let nilaiSaatIni = stock.currentPrice * userStock.saham;
            let profitLoss = nilaiSaatIni - userStock.totalInvest;
            let persenPL = userStock.totalInvest > 0 ? (profitLoss / userStock.totalInvest * 100).toFixed(2): 0;
            let plIcon = profitLoss >= 0 ? "📈": "📉";

            let teks = `*${stock.icon} DETAIL SAHAM ${targetKode}* ${stock.icon}\n\n`;
            teks += `*📊 Nama : ${stock.name}*\n`;
            teks += `*🏭 Sektor : ${stock.sector}*\n`;
            teks += `*📦 Lot : ${userStock.lot} lot (${userStock.saham.toLocaleString()} lembar)*\n`;
            teks += `*💰 Rata-rata beli : Rp${Math.floor(userStock.avgPrice).toLocaleString()}/lembar*\n`;
            teks += `*💎 Total modal : Rp${(userStock.totalInvest || 0).toLocaleString()}*\n`;
            teks += `*📈 Harga sekarang : Rp${stock.currentPrice.toLocaleString()}/lembar\n`;
            teks += `*💵 Nilai sekarang : Rp${Math.floor(nilaiSaatIni).toLocaleString()}*\n`;
            teks += `*${plIcon} Profit/Loss : ${profitLoss >= 0 ? "+": ""}Rp${Math.floor(profitLoss).toLocaleString()} (${persenPL}%)*\n\n`;
            teks += `*📌 Jual : /juallaham ${targetKode} [lot]*\n`;
            teks += `*📌 Beli lagi : /belisaham ${targetKode} [lot]*`;

            await socket.sendMessage(idChat, {
              text: teks
            }, {
              quoted: pesan
            });

          } else {
            // Tampilkan semua portfolio
            let totalNilai = 0;
            let totalModal = 0;
            let teks = `*📊 PORTFOLIO SAHAM LENGKAP* 📊\n\n`;
            teks += `*👤 User : @${username}*\n`;
            teks += `*━━━━━━━━━━━━━━━━━━━━━━━━*\n\n`;

            let sortedPortfolio = Object.entries(globalSaham.users[username].portfolio)
            .sort((a, b) => b[1].nilaiSaatIni - a[1].nilaiSaatIni);

            for (let [kode, data] of sortedPortfolio) {
              let stock = globalSaham.stocks[kode];
              if (stock && data.lot > 0) {
                let nilaiSaatIni = stock.currentPrice * data.saham;
                let profitLoss = nilaiSaatIni - data.totalInvest;
                let persenPL = data.totalInvest > 0 ? (profitLoss / data.totalInvest * 100).toFixed(2): 0;
                let plIcon = profitLoss >= 0 ? "✅": "❌";

                teks += `${stock.icon} *${kode} - ${stock.name}*\n`;
                teks += `   *📦 ${data.lot} lot (${data.saham.toLocaleString()} lembar)*\n`;
                teks += `   *💰 Harga skrg : Rp${stock.currentPrice.toLocaleString()}*\n`;
                teks += `   *💎 Nilai : Rp${Math.floor(nilaiSaatIni).toLocaleString()}*\n`;
                teks += `   *${plIcon} P/L : ${profitLoss >= 0 ? "+": ""}Rp${Math.floor(profitLoss).toLocaleString()} (${persenPL}%)*\n`;
                teks += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                totalNilai += nilaiSaatIni;
                totalModal += data.totalInvest;
              }
            }

            let totalPL = totalNilai - totalModal;
            let totalPersen = totalModal > 0 ? (totalPL / totalModal * 100).toFixed(2): 0;
            let totalIcon = totalPL >= 0 ? "🚀": "📉";

            teks += `*📊 TOTAL KESELURUHAN*\n`;
            teks += `*💰 Total modal : Rp${Math.floor(totalModal).toLocaleString()}*\n`;
            teks += `*💵 Total nilai : Rp${Math.floor(totalNilai).toLocaleString()}*\n`;
            teks += `*${totalIcon} Total P/L: ${totalPL >= 0 ? "+": ""}Rp${Math.floor(totalPL).toLocaleString()} (${totalPersen}%)*\n`;
            teks += `*💳 Saldo anda : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n`;
            teks += `*📌 Cek detail : /ceksaham [kode]*\n`;
            teks += `*📌 Cek history : /historysaham*`;

            await socket.sendMessage(idChat, {
              text: teks, mentions: [pengirim]
            }, {
              quoted: pesan
            });
          }

        } catch (err) {
          console.log("CEKSAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal cek portfolio saham!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "historysaham":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let page = parseInt(args[0]) || 1;
          const itemsPerPage = 10;

          if (!globalSaham.users[username] || !globalSaham.users[username].history || globalSaham.users[username].history.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📜 HISTORY TRANSAKSI SAHAM*\n\n*❌ Belum ada riwayat transaksi!*\n*📌 Mulai beli saham dengan /belisaham*"
            }, {
              quoted: pesan
            });
            break;
          }

          let history = globalSaham.users[username].history;
          let totalPages = Math.ceil(history.length / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages) page = totalPages;

          let startIdx = (page - 1) * itemsPerPage;
          let endIdx = startIdx + itemsPerPage;
          let pageHistory = history.slice(startIdx, endIdx);

          // Hitung total profit/loss dari history
          let totalProfit = 0;
          for (let h of history) {
            if (h.type === "JUAL" && h.profit) totalProfit += h.profit;
          }
          let profitIcon = totalProfit >= 0 ? "📈": "📉";

          let teks = `*📜 HISTORY TRANSAKSI SAHAM* 📜\n\n`;
          teks += `*👤 User : @${username}*\n`;
          teks += `*📊 Total transaksi : ${history.length} kali*\n`;
          teks += `*${profitIcon} Total profit : ${totalProfit >= 0 ? "+": ""}Rp${Math.floor(totalProfit).toLocaleString()}*\n`;
          teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━━━━━*\n\n`;

          let no = startIdx + 1;
          for (let h of pageHistory) {
            let date = new Date(h.time).toLocaleString("id-ID", {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
            let typeIcon = h.type === "BELI" ? "🟢": "🔴";
            let stock = globalSaham.stocks[h.kode];
            let stockIcon = stock ? stock.icon: "📊";

            teks += `${no}. ${typeIcon} *${h.type}* ${stockIcon} *${h.kode}*\n`;
            teks += `   *└ 📦 ${h.lot} lot (${h.saham.toLocaleString()} lembar)*\n`;
            teks += `   *└ 💰 Harga : Rp${h.price.toLocaleString()}/lembar*\n`;
            teks += `   *└ 💎 Total : Rp${h.total.toLocaleString()}*\n`;

            if (h.type === "JUAL") {
              let profitColor = h.profit >= 0 ? "+": "";
              let profitIconSmall = h.profit >= 0 ? "✅": "❌";
              teks += `   *└ 💵 Bersih : Rp${Math.floor(h.net).toLocaleString()}*\n`;
              teks += `   *└ ${profitIconSmall} Profit : ${profitColor}Rp${Math.floor(h.profit).toLocaleString()}*\n`;
            }
            teks += `   *└ 🕐 ${date}*\n`;
            teks += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            no++;
          }

          if (totalPages > 1) {
            teks += `*📌 NAVIGASI :*\n`;
            if (page > 1) teks += `• */historysaham ${page - 1} - Sebelumnya*\n`;
            if (page < totalPages) teks += `• */historysaham ${page + 1} - Berikutnya*\n`;
            teks += `\n`;
          }

          teks += `*📌 /ceksaham - Lihat portfolio saham Anda*\n`;
          teks += `*📌 /topsaham - Top 10 investor saham*`;

          await socket.sendMessage(idChat, {
            text: teks,
            mentions: [pengirim]
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("HISTORYSAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan history!*\n\n*Error: " + err.message
          }, {
            quoted: pesan
          });
        }
        break;
      case "hargasaham":
        try {
          let page = parseInt(args[0]) || 1;
          let itemsPerPage = 20;
          let stocksArray = Object.entries(globalSaham.stocks);
          let totalPages = Math.ceil(stocksArray.length / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages) page = totalPages;

          let startIdx = (page - 1) * itemsPerPage;
          let endIdx = startIdx + itemsPerPage;
          let pageStocks = stocksArray.slice(startIdx, endIdx);

          let teks = `*📊 MARKET SUMMARY - HARGA SAHAM* 📊\n\n`;
          teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━━━━━*\n\n`;

          let indeksKomposit = 0;
          let totalPerubahan = 0;

          for (let [kode, stock] of pageStocks) {
            let perubahan = ((stock.currentPrice - stock.initialPrice) / stock.initialPrice * 100).toFixed(2);
            let perubahanAngka = parseFloat(perubahan);
            let changeIcon = perubahanAngka >= 0 ? "📈": "📉";

            teks += `${stock.icon} *${kode} | ${stock.name}*\n`;
            teks += `   *💰 Rp${stock.currentPrice.toLocaleString()}*\n`;
            teks += `   *${changeIcon} ${Math.abs(perubahanAngka)}% | 📊 ${(stock.volume / 1000).toLocaleString()}K lot*\n`;
            teks += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            indeksKomposit += stock.currentPrice;
            totalPerubahan += perubahanAngka;
          }

          if (totalPages > 1) {
            teks += `*📌 Navigasi:*\n`;
            if (page > 1) teks += `• */hargasaham ${page - 1} - Halaman sebelumnya*\n`;
            if (page < totalPages) teks += `• */hargasaham ${page + 1} - Halaman berikutnya*\n`;
            teks += `\n`;
          }

          let indeksRata = indeksKomposit / pageStocks.length;
          teks += `*📊 INDEKS HARGA ${page == 1 ? "KOMPOSIT": "HALAMAN INI"}*\n`;
          teks += `*💰 Nilai : ${Math.floor(indeksRata).toLocaleString()} pts*\n`;
          teks += `*⏰ Update : ${new Date(globalSaham.indeks?.lastUpdate || Date.now()).toLocaleTimeString("id-ID")}*\n\n`;
          teks += `*📌 Cek semua saham : /listsaham*\n`;
          teks += `*📌 Update harga otomatis tiap 90 detik!*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("HARGASAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan harga saham!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "sahamfluktuasi":
        try {
          let keys = Object.keys(sahamFluktuasi).sort((a, b) => b - a);
          let lastKeys = keys.slice(0, 10);

          if (lastKeys.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📊 HISTORY FLUKTUASI SAHAM*\n\n*❌ Belum ada data fluktuasi!*\n\n*📌 Tunggu update harga otomatis (90 detik sekali)*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*📊 HISTORY FLUKTUASI SAHAM (10 Terakhir)* 📊\n\n`;

          for (let key of lastKeys) {
            let changes = sahamFluktuasi[key];
            let date = new Date(parseInt(key)).toLocaleString("id-ID");
            teks += `*🕐 ${date}*\n`;

            for (let change of changes.slice(0, 5)) {
              let changeIcon = change.persen >= 0 ? "📈": "📉";
              let changeColor = change.persen >= 0 ? "+": "";
              teks += `   *${changeIcon} ${change.kode} : Rp${change.lama.toLocaleString()} → Rp${change.baru.toLocaleString()} (${changeColor}${change.persen}%)*\n`;
            }
            teks += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          }

          teks += `*📌 Update harga setiap 90 detik*\n`;
          teks += `*📌 Cek /hargasaham untuk harga terkini*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("SAHAMFLUKTUASI ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan history fluktuasi!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "topsaham":
        try {
          let userRank = [];

          for (let [username, data] of Object.entries(globalSaham.users)) {
            if (data && data.totalInvest > 0) {
              let totalNilai = 0;
              for (let [kode, stockData] of Object.entries(data.portfolio || {})) {
                let stock = globalSaham.stocks[kode];
                if (stock) {
                  totalNilai += stock.currentPrice * stockData.saham;
                }
              }
              userRank.push({
                username, totalInvest: data.totalInvest, totalNilai
              });
            }
          }

          userRank.sort((a, b) => b.totalNilai - a.totalNilai);
          let top10 = userRank.slice(0, 10);

          if (top10.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*🏆 TOP 10 INVESTOR SAHAM*\n\n*❌ Belum ada investor!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*🏆 TOP 10 INVESTOR SAHAM* 🏆\n\n`;
          let medals = ["🥇",
            "🥈",
            "🥉",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟"];

          for (let i = 0; i < top10.length; i++) {
            let user = top10[i];
            let displayName = users[getUserIdByUsername(user.username)]?.displayName || user.username;
            let verifiedLogo = verifiedData.verifiedUsers.includes(user.username) ? `*${verifiedData.settings.badgeIcon}*`: "";

            teks += `${medals[i]} *${displayName}* ${verifiedLogo}\n`;
            teks += `*👤 @${user.username}*\n`;
            teks += `*💰 Nilai portfolio : Rp${Math.floor(user.totalNilai).toLocaleString()}*\n`;
            teks += `*📊 Total invest : Rp${Math.floor(user.totalInvest).toLocaleString()}*\n\n`;
          }

          teks += `*📌 Mulai investasi dengan /belisaham [kode] [lot]*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TOPSAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan top investor!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "saham":
        try {
          let teks = `*📊 MENU SAHAM (56 Perusahaan)* 📊\n\n`;
          teks += `*📌 COMMAND DASAR:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• */listsaham - Lihat daftar semua saham*\n`;
          teks += `• */listsaham [halaman] - Lihat halaman tertentu*\n`;
          teks += `• */hargasaham [halaman] - Lihat harga saham*\n`;
          teks += `• */sahamfluktuasi - History pergerakan harga*\n\n`;

          teks += `*💰 TRANSAKSI SAHAM:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• */belisaham [kode] [lot] - Beli saham*\n`;
          teks += `• */juallaham [kode] [lot/all] - Jual saham*\n`;
          teks += `• *Contoh: /belisaham BBCA 5*\n`;
          teks += `• *Contoh : /juallaham BBRI all*\n`;
          teks += `• *1 lot = 100 saham*\n\n`;

          teks += `*📊 PORTOFOLIO & HISTORY:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• */ceksaham - Lihat semua portfolio Anda*\n`;
          teks += `• */ceksaham [kode] - Lihat detail saham tertentu*\n`;
          teks += `• */historysaham - Riwayat transaksi saham*\n`;
          teks += `• */topsaham - Top 10 investor saham*\n\n`;

          teks += `*💡 INFORMASI:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• *Pajak jual saham : 0.3%*\n`;
          teks += `• *Update harga saham tiap 90 detik*\n`;
          teks += `• *Minimal beli : 1 lot*\n`;
          teks += `• *Harga fluktuasi -5% sampai +7%*\n\n`;

          teks += `*🏢 SEKTOR YANG TERSEDIA:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• *Perbankan | Telekomunikasi | Otomotif*\n`;
          teks += `• *Consumer Goods | Energi | Teknologi*\n`;
          teks += `• *Properti | Agrikultur | Pertambangan*\n`;
          teks += `• *Farmasi | Ritel | Semen | Transportasi*\n\n`;

          teks += `*_© 2026 Kaelorix. All Right Reserved_*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("SAHAM MENU ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan menu saham!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "invest":
        try {
          let teks = `*💰 MENU INVESTASI* 💰\n\n`;
          teks += `*🪙 INVESTASI CRYPTO :*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• */harga [aset] - Cek harga aset realtime*\n`;
          teks += `• */beli [aset] [jumlah] - Beli aset*\n`;
          teks += `• */crypto - Lihat semua info aset crypto*\n`
          teks += `• */jual [aset] [gram/all] - Jual aset (pajak 2%)*\n`;
          teks += `• */cek [aset] - Cek portfolio aset Anda*\n`;
          teks += `• *Contoh : /beli btc 100000*\n`;
          teks += `• *Contoh : /jual btc all*\n\n`;

          teks += `*📊 INFORMASI HARGA:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += + `• *Harga emas : Rp${hargaEmas.toLocaleString()}/gram*\n`;
          teks += `• *Harga Bitcoin : Rp${hargaBitcoin.toLocaleString()}/BTC*\n`;
          teks += `• *Rentang emas : Rp500.000 - Rp2.600.000*\n`;
          teks += `• *Rentang BTC : Rp700jt - Rp6M*\n\n`;

          teks += `*📈 FLUKTUASI HARGA:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• *Perubahan: Random 0.1% - 5%*\n`;
          teks += `• */cekfluktuasi - Lihat history fluktuasi*\n\n`;

          teks += `*💡 TIPS INVESTASI:*\n`;
          teks += `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n`;
          teks += `• *Beli saat harga rendah, jual saat tinggi*\n`;
          teks += `• *Pantau fluktuasi untuk max profit*\n`;
          teks += `• *Pajak jual 2% untuk semua aset*\n`;
          teks += `• *History transaksi tersimpan otomatis*\n\n`;

          teks += `*📌 Gunakan /saham - Untuk menu saham*\n\n`;
          teks += `*_© 2026 Kaelorix. All Right Reserved_*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("INVEST MENU ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan menu investasi!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "marketku":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username; // ✅ TAMBAHKAN INI

          let page = parseInt(args[0]) || 1;
          const itemsPerPage = 10;

          let myProducts = Object.values(globalMarketplace).filter(p => p.seller === username);
          let totalProducts = myProducts.length;
          let totalPages = Math.ceil(totalProducts / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages && totalPages > 0) page = totalPages;

          if (totalProducts === 0) {
            await socket.sendMessage(idChat, {
              text: "*🛒 BELUM ADA PRODUK!*\n\n*Kamu belum menjual ikan apapun. Ketik /sell untuk mulai berjualan.*"
            }, {
              quoted: pesan
            });
            break;
          }

          myProducts.sort((a, b) => b.time - a.time);
          const startIdx = (page - 1) * itemsPerPage;
          const endIdx = startIdx + itemsPerPage;
          const pageProducts = myProducts.slice(startIdx, endIdx);

          const rarityIcon = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };

          let teks = `*🛒 PRODUK SAYA* 🛒\n\n`;
          teks += `*📊 Total produk : ${totalProducts}*\n`;
          teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*📋 Menampilkan produk ${startIdx + 1} - ${Math.min(endIdx, totalProducts)}*\n\n`;

          let no = startIdx + 1;
          for (let product of pageProducts) {
            teks += `${no}. ${product.fishEmoji} *${product.fishName}* ${rarityIcon[product.rarity]}\n`;
            teks += `   📦 *Stok : ${product.quantity} ekor* | 💰 *Rp${product.price.toLocaleString()}/ekor*\n`;
            teks += `   🆔 *ID : ${product.id}*\n\n`;
            no++;
          }

          if (totalPages > 1) {
            teks += `*📌 Navigasi :*\n`;
            if (page > 1) teks += `• *Halaman sebelumnya : /marketku ${page - 1}*\n`;
            if (page < totalPages) teks += `• *Halaman berikutnya : /marketku ${page + 1}*\n`;
            teks += `\n`;
          }

          teks += `*📌 Batalkan jual : /cancel [ID produk]*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("MARKETKU ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal menampilkan produk Anda.*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "cancel":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username; // ✅ TAMBAHKAN INI

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh : /cancel 1700000000_abc123*\n*📌 Cek ID produk dengan /marketku*"
            }, {
              quoted: pesan
            });
            break;
          }

          let productId = args[0];
          let product = globalMarketplace[productId];

          if (!product) {
            await socket.sendMessage(idChat, {
              text: `*❌ Produk dengan ID "${productId}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (product.seller !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda tidak bisa membatalkan produk orang lain!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!globalFishInventory[username]) {
            globalFishInventory[username] = {
              totalCasts: 0,
              totalFish: 0,
              fishList: [],
              stats: {
                basic: 0,
                rare: 0,
                legendary: 0,
                mythic: 0,
                secret: 0
              }
            };
          }

          for (let i = 0; i < product.quantity; i++) {
            globalFishInventory[username].fishList.unshift({
              name: product.fishName,
              rarity: product.rarity,
              emoji: product.fishEmoji,
              location: "Marketplace",
              time: Date.now()
            });
            globalFishInventory[username].totalFish++;
            globalFishInventory[username].stats[product.rarity]++;
          }

          delete globalMarketplace[productId];

          saveDB("./lib/database/globalFishInventory.json", globalFishInventory);
          saveDB("./lib/database/globalMarketplace.json", globalMarketplace);

          const rarityIcon = {
            basic: "⭐",
            rare: "✨",
            legendary: "🔥",
            mythic: "👑",
            secret: "💎"
          };

          await socket.sendMessage(idChat, {
            text: `*✅ PRODUK BERHASIL DIBATALKAN!*\n\n*Produk : ${product.fishEmoji} ${product.fishName} ${rarityIcon[product.rarity]}*\n*📦 ${product.quantity} ekor dikembalikan ke inventory Anda.*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CANCEL ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ ERROR!*\n\n*Gagal membatalkan produk.*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "follow":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /follow [username] / @user*\n*📌 Contoh: /follow kaelorix*\n*📌 Contoh: /follow @kaelorix*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Ambil target dari argumen atau mention
          let targetUsername = null;
          let mentionJid = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionJid && users[mentionJid]) {
            targetUsername = users[mentionJid].username;
          } else {
            let rawTarget = args[0].toLowerCase().replace(/^@/, '');
            targetUsername = rawTarget;
          }

          if (!targetUsername) {
            await socket.sendMessage(idChat, {
              text: "*❌ Target tidak valid!*\n\n*📌 /follow [username] / @user*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (targetUsername === username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Tidak bisa follow diri sendiri!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah target user terdaftar di bot
          let targetUserId = getUserIdByUsername(targetUsername);
          if (!targetUserId) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} tidak ditemukan!*\n\n*📌 Pastikan user sudah register dengan /login*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Inisialisasi data sosial jika belum ada
          if (!socialData.users[username]) {
            socialData.users[username] = {
              followers: [],
              following: [],
              friends: [],
              bio: "",
              joinDate: Date.now(),
              lastActive: Date.now(),
              posts: 0
            };
          }
          if (!socialData.users[targetUsername]) {
            socialData.users[targetUsername] = {
              followers: [],
              following: [],
              friends: [],
              bio: "",
              joinDate: Date.now(),
              lastActive: Date.now(),
              posts: 0
            };
          }

          // Cek apakah sudah follow
          if (socialData.users[username].following.includes(targetUsername)) {
            await socket.sendMessage(idChat, {
              text: `*❌ Anda sudah follow @${targetUsername}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Proses follow
          socialData.users[username].following.push(targetUsername);
          socialData.users[targetUsername].followers.push(username);

          // Update friends (mutual follow)
          await updateUserStats(username);
          await updateUserStats(targetUsername);

          saveDB("./lib/database/social.json", socialData);

          // Kirim notifikasi ke target
          let targetJid = getUserIdByUsername(targetUsername);
          if (targetJid) {
            await socket.sendMessage(targetJid, {
              text: `*🔔 NOTIFIKASI!*\n\n*@${username} mulai mengikuti Anda!*\n*👥 Followers Anda sekarang: ${socialData.users[targetUsername].followers.length}*`
            }).catch(() => {});
          }

          // Cek apakah target sudah follow balik (mutual)
          let mutualFollow = socialData.users[targetUsername].following.includes(username);

          if (mutualFollow) {
            await socket.sendMessage(idChat, {
              text: `*✅ ANDA SEKARANG BERTEMAN DENGAN @${targetUsername}!* 🎉\n\n*Kalian saling follow!*`,
              mentions: [targetUserId]
            }, {
              quoted: pesan
            });

            if (targetJid) {
              await socket.sendMessage(targetJid, {
                text: `*🎉 SELAMAT!*\n\n*Anda sekarang berteman dengan @${username}!*`
              }).catch(() => {});
            }
          } else {
            await socket.sendMessage(idChat, {
              text: `*✅ BERHASIL FOLLOW @${targetUsername}!*\n\n*👥 Followers : ${socialData.users[username].followers.length}*\n*📌 Following : ${socialData.users[username].following.length}*`,
              mentions: [targetUserId]
            }, {
              quoted: pesan
            });
          }

        } catch (err) {
          console.log("FOLLOW ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal follow!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "unfollow":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /unfollow [username] / @user*\n*📌 Contoh: /unfollow kaelorix*\n*📌 Contoh: /unfollow @kaelorix*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Ambil target dari argumen atau mention
          let targetUsername = null;
          let mentionJid = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionJid && users[mentionJid]) {
            // Jika ada mention, ambil username dari JID yang di-mention
            targetUsername = users[mentionJid].username;
          } else {
            // Jika tidak ada mention, bersihkan @ dari argumen
            let rawTarget = args[0].toLowerCase().replace(/^@/, '');
            targetUsername = rawTarget;
          }

          if (!targetUsername) {
            await socket.sendMessage(idChat, {
              text: "*❌ Target tidak valid!*\n\n*📌 /unfollow [username] / @user*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!socialData.users[username] || !socialData.users[username].following.includes(targetUsername)) {
            await socket.sendMessage(idChat, {
              text: `*❌ Anda tidak sedang follow @${targetUsername}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Proses unfollow
          socialData.users[username].following = socialData.users[username].following.filter(u => u !== targetUsername);
          if (socialData.users[targetUsername]) {
            socialData.users[targetUsername].followers = socialData.users[targetUsername].followers.filter(u => u !== username);
          }

          // Update friends
          await updateUserStats(username);
          await updateUserStats(targetUsername);

          saveDB("./lib/database/social.json", socialData);

          // Ambil JID target untuk mention (opsional)
          let targetJid = getUserIdByUsername(targetUsername);
          let mentionArray = targetJid ? [targetJid]: [];

          await socket.sendMessage(idChat, {
            text: `*✅ BERHASIL UNFOLLOW @${targetUsername}!*`,
            mentions: mentionArray
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("UNFOLLOW ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal unfollow!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "followers":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let targetUsername = args[0] ? args[0].toLowerCase(): username;

          let social = socialData.users[targetUsername];
          if (!social) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} belum memiliki data sosial!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let followers = social.followers || [];
          let page = parseInt(args[1]) || 1;
          let itemsPerPage = 10;
          let totalPages = Math.ceil(followers.length / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages && totalPages > 0) page = totalPages;

          let startIdx = (page - 1) * itemsPerPage;
          let pageFollowers = followers.slice(startIdx, startIdx + itemsPerPage);

          let teks = `*👥 DAFTAR FOLLOWERS* 👥\n\n`;
          teks += `*👤 User : @${targetUsername}*\n`;
          teks += `*📊 Total : ${followers.length} followers*\n`;
          if (totalPages > 1) teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          if (pageFollowers.length === 0) {
            teks += `*❌ Belum ada followers!*\n`;
          } else {
            for (let i = 0; i < pageFollowers.length; i++) {
              let f = pageFollowers[i];
              let isFollowBack = socialData.users[targetUsername]?.following.includes(f) ? "✅ (Follow back)": "❌";
              teks += `${startIdx + i + 1}. @${f} ${isFollowBack}\n`;
            }
          }

          if (totalPages > 1) {
            teks += `\n*📌 Navigasi:*\n`;
            if (page > 1) teks += `• */followers ${targetUsername} ${page - 1}*\n`;
            if (page < totalPages) teks += `• */followers ${targetUsername} ${page + 1}*\n`;
          }

          teks += `\n*📌 /follow [username] - Follow user*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("FOLLOWERS ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil followers!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "following":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let targetUsername = args[0] ? args[0].toLowerCase(): username;

          let social = socialData.users[targetUsername];
          if (!social) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} belum memiliki data sosial!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let following = social.following || [];
          let page = parseInt(args[1]) || 1;
          let itemsPerPage = 10;
          let totalPages = Math.ceil(following.length / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages && totalPages > 0) page = totalPages;

          let startIdx = (page - 1) * itemsPerPage;
          let pageFollowing = following.slice(startIdx, startIdx + itemsPerPage);

          let teks = `*📌 DAFTAR FOLLOWING* 📌\n\n`;
          teks += `*👤 User : @${targetUsername}*\n`;
          teks += `*📊 Total : ${following.length} following*\n`;
          if (totalPages > 1) teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          if (pageFollowing.length === 0) {
            teks += `*❌ Belum mengikuti siapa pun!*\n`;
          } else {
            for (let i = 0; i < pageFollowing.length; i++) {
              let f = pageFollowing[i];
              let isFollowBack = socialData.users[f]?.followers.includes(targetUsername) ? "✅ (Follow back)": "❌";
              teks += `${startIdx + i + 1}. @${f} ${isFollowBack}\n`;
            }
          }

          if (totalPages > 1) {
            teks += `\n*📌 Navigasi :*\n`;
            if (page > 1) teks += `• */following ${targetUsername} ${page - 1}*\n`;
            if (page < totalPages) teks += `• */following ${targetUsername} ${page + 1}*\n`;
          }

          teks += `\n*📌 /follow [username] - Follow user*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("FOLLOWING ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil following!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "friends":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let targetUsername = args[0] ? args[0].toLowerCase(): username;

          let social = socialData.users[targetUsername];
          if (!social) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} belum memiliki data sosial!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let friends = social.friends || [];
          let page = parseInt(args[1]) || 1;
          let itemsPerPage = 10;
          let totalPages = Math.ceil(friends.length / itemsPerPage);

          if (page < 1) page = 1;
          if (page > totalPages && totalPages > 0) page = totalPages;

          let startIdx = (page - 1) * itemsPerPage;
          let pageFriends = friends.slice(startIdx, startIdx + itemsPerPage);

          let teks = `*🤝 DAFTAR TEMAN* 🤝\n\n`;
          teks += `*👤 User : @${targetUsername}*\n`;
          teks += `*📊 Total : ${friends.length} teman*\n`;
          if (totalPages > 1) teks += `*📄 Halaman ${page} dari ${totalPages}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          if (pageFriends.length === 0) {
            teks += `*❌ Belum memiliki teman!*\n*📌 Follow user dan minta mereka follow balik untuk berteman*\n`;
          } else {
            for (let i = 0; i < pageFriends.length; i++) {
              teks += `${startIdx + i + 1}. @${pageFriends[i]}\n`;
            }
          }

          if (totalPages > 1) {
            teks += `\n*📌 Navigasi:*\n`;
            if (page > 1) teks += `• */friends ${targetUsername} ${page - 1}*\n`;
            if (page < totalPages) teks += `• */friends ${targetUsername} ${page + 1}*\n`;
          }

          teks += `\n*📌 /follow [username] - Mulai berteman*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("FRIENDS ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil daftar teman!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "addcentang":
        try {
          // Hanya owner yang bisa
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /addcentang [username] / @user*\n*📌 Contoh: /addcentang kaelorix*\n*📌 Contoh: /addcentang @kaelorix*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Ambil target dari argumen atau mention
          let targetUsername = null;
          let mentionJid = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionJid && users[mentionJid]) {
            targetUsername = users[mentionJid].username;
          } else {
            let rawTarget = args[0].toLowerCase().replace(/^@/, '');
            targetUsername = rawTarget;
          }

          if (!targetUsername) {
            await socket.sendMessage(idChat, {
              text: "*❌ Target tidak valid!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah user terdaftar
          let targetUserId = getUserIdByUsername(targetUsername);
          if (!targetUserId) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} tidak ditemukan!*\n\n*📌 Pastikan user sudah register dengan /login*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah sudah terverifikasi
          if (verifiedData.verifiedUsers.includes(targetUsername)) {
            await socket.sendMessage(idChat, {
              text: `*❌ @${targetUsername} sudah memiliki centang resmi!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Tambahkan centang
          verifiedData.verifiedUsers.push(targetUsername);

          // Hapus dari request jika ada
          verifiedData.requests = verifiedData.requests.filter(r => r.username !== targetUsername);

          saveDB("./lib/database/verified.json", verifiedData);

          // Kirim notifikasi ke user
          let targetJid = getUserIdByUsername(targetUsername);
          if (targetJid) {
            await socket.sendMessage(targetJid, {
              text: `*🎉 SELAMAT! 🎉*\n\n*Akun @${targetUsername} telah mendapatkan centang resmi!*\n\n*✅ Sekarang nama Anda akan ditampilkan dengan ${verifiedData.settings.badgeIcon} di samping nama.*`
            }).catch(() => {});
          }

          await socket.sendMessage(idChat, {
            text: `*✅ BERHASIL MEMBERIKAN CENTANG RESMI!*\n\n*👤 User: @${targetUsername}*\n*📛 Display: ${users[targetUserId].displayName}*\n\n*🎉 User telah dinotifikasi.*`,
            mentions: [targetUserId]
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("ADDCENTANG ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menambah centang!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "removecentang":
        try {
          // Hanya owner yang bisa
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /removecentang [username] / @user*\n*📌 Contoh: /removecentang kaelorix*\n*📌 Contoh: /removecentang @kaelorix*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Ambil target dari argumen atau mention
          let targetUsername = null;
          let mentionJid = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionJid && users[mentionJid]) {
            targetUsername = users[mentionJid].username;
          } else {
            let rawTarget = args[0].toLowerCase().replace(/^@/, '');
            targetUsername = rawTarget;
          }

          if (!targetUsername) {
            await socket.sendMessage(idChat, {
              text: "*❌ Target tidak valid!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah terverifikasi
          if (!verifiedData.verifiedUsers.includes(targetUsername)) {
            await socket.sendMessage(idChat, {
              text: `*❌ @${targetUsername} tidak memiliki centang resmi!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Hapus centang
          verifiedData.verifiedUsers = verifiedData.verifiedUsers.filter(u => u !== targetUsername);

          saveDB("./lib/database/verified.json", verifiedData);

          // Kirim notifikasi ke user
          let targetJid = getUserIdByUsername(targetUsername);
          await socket.sendMessage(targetJid, `*⚠️ PEMBERITAHUAN ⚠️*\n\n*Centang resmi akun @${targetUsername} telah dicabut.*\n\n*📌 Hubungi owner untuk informasi lebih lanjut.*`);

          await socket.sendMessage(idChat, {
            text: `*✅ CENTANG RESMI DICABUT!*\n\n*👤 User: @${targetUsername}*\n\n*⚠️ User telah dinotifikasi.*`,
            mentions: [targetJid].filter(Boolean)
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("REMOVECENTANG ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menghapus centang!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "topglobal":
        try {
          // Load database
          let globalSaldoData = loadDB("./lib/database/globalSaldo.json") || {};
          let usersData = loadDB("./lib/database/users.json") || {};

          // Buat mapping dari username ke displayName
          let usernameToDisplay = {};
          let usernameToJid = {};
          for (let [jid, userData] of Object.entries(usersData)) {
            if (userData && userData.username) {
              usernameToDisplay[userData.username] = userData.displayName || userData.username;
              usernameToJid[userData.username] = jid;
            }
          }

          // Urutkan dari terbesar ke terkecil
          let sortedGlobal = Object.entries(globalSaldoData)
          .filter(([username, saldo]) => saldo > 0 && usernameToDisplay[username])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

          if (sortedGlobal.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📊 TOP 10 TERKAYA GLOBAL*\n\n*❌ Belum ada user yang memiliki saldo!*\n*📌 Ajak temanmu untuk /login dan mulai bermain!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let totalSaldoGlobal = Object.values(globalSaldoData).reduce((a, b) => a + b, 0);
          let totalUserGlobal = Object.keys(globalSaldoData).length;

          let teksGlobal = `*🌍 TOP 10 TERKAYA GLOBAL 🌍*\n\n`;
          teksGlobal += `*👥 Total user terdaftar : ${totalUserGlobal}*\n\n`;
          teksGlobal += `*👑 LEADERBOARD 👑*\n`;
          teksGlobal += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          let medalsGlobal = ["🥇",
            "🥈",
            "🥉",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟"];
          let mentionsGlobal = [];

          for (let i = 0; i < sortedGlobal.length; i++) {
            let [username,
              saldo] = sortedGlobal[i];
            let displayName = usernameToDisplay[username] || username;
            let jid = usernameToJid[username];

            if (jid) mentionsGlobal.push(jid);

            // ✅ CEK CENTANG PER USER
            let verifiedLogo = verifiedData.verifiedUsers.includes(username) ? `*${verifiedData.settings.badgeIcon}*`: "";

            teksGlobal += `${medalsGlobal[i]} *${displayName}* ${verifiedLogo}\n`;
            teksGlobal += `   👤 *@${username}*\n`;
            teksGlobal += `   💰 *Rp${saldo.toLocaleString()}*\n\n`;
          }

          // Saldo user sendiri
          let myUsername = usersData[pengirim]?.username;
          let mySaldoGlobal = myUsername ? (globalSaldoData[myUsername] || 0): 0;
          let allSaldoArray = Object.entries(globalSaldoData)
          .filter(([username]) => usernameToDisplay[username])
          .sort((a, b) => b[1] - a[1]);
          let myRankGlobal = allSaldoArray.findIndex(([username]) => username === myUsername) + 1;

          teksGlobal += `*━━━━━━━━━━━━━━━━━━━━*\n`;
          teksGlobal += `*💳 SALDO ANDA :*\n`;
          if (myUsername) {
            let myVerifiedLogo = verifiedData.verifiedUsers.includes(myUsername) ? ` ${verifiedData.settings.badgeIcon}`: "";
            teksGlobal += `*👤 Username : @${myUsername}${myVerifiedLogo}*\n`;
            teksGlobal += `*💰 Rp${mySaldoGlobal.toLocaleString()}*\n`;
            if (myRankGlobal > 0) {
              teksGlobal += `*📊 Peringkat global : #${myRankGlobal} dari ${totalUserGlobal} user*\n`;
            } else {
              teksGlobal += `*📊 Peringkat : Belum punya saldo*\n`;
            }
          } else {
            teksGlobal += `*❌ Anda belum login!*\n*📌 Ketik /login di private chat untuk mendaftar*\n`;
            if (myUsername) mentionsGlobal.push(pengirim);
          }

          teksGlobal += `\n*📌 Main slot, investasi saham, bitcoin, emas, atau mancing untuk menambah saldo!*\n*📌 Transfer saldo dengan /tfsaldo @user [jumlah]*\n\n`;
          teksGlobal += `*_© 2026 Kaelorix. All Right Reserved_*`;

          await socket.sendMessage(idChat, {
            text: teksGlobal,
            mentions: mentionsGlobal
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TOPGLOBAL ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mengambil data leaderboard global!*\n\n*Error: " + err.message + "*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "toplocal":
        if (!dariGrup) {
          await socket.sendMessage(idChat, {
            text: "*❌ Command ini hanya bisa digunakan di group!*"
          }, {
            quoted: pesan
          });
          break;
        }

        try {
          const grupMetadata = await socket.groupMetadata(idChat);
          const memberIds = grupMetadata.participants.map(p => p.id);

          // Load database
          let globalSaldoData = loadDB("./lib/database/globalSaldo.json") || {};
          let usersData = loadDB("./lib/database/users.json") || {};

          // Buat mapping dari JID ke username
          let jidToUsername = {};
          for (let [jid, userData] of Object.entries(usersData)) {
            if (userData && userData.username) {
              jidToUsername[jid] = userData.username;
            }
          }

          // Filter member yang sudah login
          let memberSaldo = [];

          for (let memberId of memberIds) {
            let username = jidToUsername[memberId];
            if (username) {
              let saldo = globalSaldoData[username] || 0;
              if (saldo > 0) {
                memberSaldo.push({
                  id: memberId,
                  username: username,
                  saldo: saldo
                });
              }
            }
          }

          // Urutkan dari terbesar ke terkecil
          memberSaldo.sort((a, b) => b.saldo - a.saldo);
          let topLocal = memberSaldo.slice(0, 10);

          if (topLocal.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📊 TOP 10 TERKAYA DI GRUP INI*\n\n*❌ Belum ada member yang memiliki saldo!*\n*📌 Suruh mereka /login dulu untuk daftar!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let totalSaldoLocal = memberSaldo.reduce((a, b) => a + b.saldo, 0);
          let totalMember = memberIds.length;
          let memberLoginCount = memberSaldo.length;

          let teksLocal = `*🏠 TOP 10 TERKAYA DI GRUP INI 🏠*\n\n`;
          teksLocal += `*👥 Total member grup : ${totalMember}*\n`;
          teksLocal += `*✅ Member terdaftar : ${memberLoginCount}*\n\n`;
          teksLocal += `*👑 LEADERBOARD 👑*\n`;
          teksLocal += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          let medalsLocal = ["🥇",
            "🥈",
            "🥉",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟"];

          for (let i = 0; i < topLocal.length; i++) {
            let member = topLocal[i];

            // Ambil nama dari database users
            let displayName = member.username;
            let userData = usersData[member.id];
            if (userData && userData.displayName) {
              displayName = userData.displayName;
            } else {
              let memberData = grupMetadata.participants.find(p => p.id === member.id);
              if (memberData && memberData.name) displayName = memberData.name;
              else if (memberData && memberData.notify) displayName = memberData.notify;
            }

            // ✅ CEK CENTANG PER USER (dalam loop)
            let verifiedLogo = verifiedData.verifiedUsers.includes(member.username) ? `*${verifiedData.settings.badgeIcon}*`: "";

            teksLocal += `${medalsLocal[i]} *${displayName}* ${verifiedLogo}\n`;
            teksLocal += `   @${member.username}\n`;
            teksLocal += `   💰 *Rp${member.saldo.toLocaleString()}*\n\n`;
          }

          // Saldo user sendiri
          let myUsername = usersData[pengirim]?.username;
          let mySaldoLocal = myUsername ? (globalSaldoData[myUsername] || 0): 0;
          let myRankLocal = memberSaldo.findIndex(m => m.id === pengirim) + 1;

          teksLocal += `*━━━━━━━━━━━━━━━━━━━━*\n`;
          teksLocal += `*💳 SALDO ANDA :*\n`;
          if (myUsername) {
            teksLocal += `*👤 Username : @${myUsername}*\n`;
            teksLocal += `*💰 Rp${mySaldoLocal.toLocaleString()}*\n`;
            if (myRankLocal > 0) {
              teksLocal += `*📊 Peringkat : #${myRankLocal} dari ${memberSaldo.length} member*\n`;
            } else {
              teksLocal += `*📊 Peringkat : Belum punya saldo*\n`;
            }
          } else {
            teksLocal += `*❌ Anda belum login!*\n*📌 Ketik /login di private chat untuk mendaftar*\n`;
          }

          teksLocal += `\n*📌 Main game atau investasi untuk menambah saldo!*\n*📌 Transfer saldo dengan /tfsaldo @user [jumlah]*`;

          let mentionsLocal = topLocal.map(m => m.id).filter(id => id);
          if (myUsername) mentionsLocal.push(pengirim);

          await socket.sendMessage(idChat, {
            image: {
              url: randomThumb()
            },
            caption: teksLocal,
            mentions: mentionsLocal
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TOPLOCAL ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mengambil data member grup!*\n\n*Error: " + err.message + "*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "topglobal":
        try {
          let username = users[pengirim].username;
          // Load database yang pakai username
          let globalSaldoData = loadDB("./lib/database/globalSaldo.json") || {};
          let usersData = loadDB("./lib/database/users.json") || {};
          let verifiedLogo = verifiedData.verifiedUsers.includes(username) ? ` ${verifiedData.settings.badgeIcon}`: "";

          // Buat mapping dari username ke displayName
          let usernameToDisplay = {};
          let usernameToJid = {};
          for (let [jid, userData] of Object.entries(usersData)) {
            if (userData && userData.username) {
              usernameToDisplay[userData.username] = userData.displayName || userData.username;
              usernameToJid[userData.username] = jid;
            }
          }

          // Ubah object ke array dan urutkan dari terbesar ke terkecil
          let sortedGlobal = Object.entries(globalSaldoData)
          .filter(([username, saldo]) => saldo > 0 && usernameToDisplay[username]) // hanya user yang terdaftar
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

          if (sortedGlobal.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📊 TOP 10 TERKAYA GLOBAL*\n\n*❌ Belum ada user yang memiliki saldo!*\n*📌 Ajak temanmu untuk /login dan mulai bermain!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let totalSaldoGlobal = Object.values(globalSaldoData).reduce((a, b) => a + b, 0);
          let totalUserGlobal = Object.keys(globalSaldoData).length;

          let teksGlobal = `*🌍 TOP 10 TERKAYA GLOBAL 🌍*\n\n`;
          teksGlobal += `*👥 Total user terdaftar : ${totalUserGlobal}*\n\n`;
          teksGlobal += `*👑 LEADERBOARD 👑*\n`;
          teksGlobal += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          let medalsGlobal = ["🥇",
            "🥈",
            "🥉",
            "4️⃣",
            "5️⃣",
            "6️⃣",
            "7️⃣",
            "8️⃣",
            "9️⃣",
            "🔟"];
          let mentionsGlobal = [];

          for (let i = 0; i < sortedGlobal.length; i++) {
            let [username,
              saldo] = sortedGlobal[i];
            let displayName = usernameToDisplay[username] || username;
            let jid = usernameToJid[username];

            if (jid) mentionsGlobal.push(jid);

            let persenDariTotal = totalSaldoGlobal > 0 ? (saldo / totalSaldoGlobal * 100).toFixed(1): 0;

            teksGlobal += `${medalsGlobal[i]} *${displayName} ${verifiedLogo}*\n`;
            teksGlobal += `   👤 *@${username}*\n`;
            teksGlobal += `   💰 *Rp${saldo.toLocaleString()}*\n\n`;
          }

          // Tambahkan informasi saldo user sendiri (jika tidak masuk top 10)
          let myUsername = usersData[pengirim]?.username;
          let mySaldoGlobal = myUsername ? (globalSaldoData[myUsername] || 0): 0;
          let allSaldoArray = Object.entries(globalSaldoData)
          .filter(([username]) => usernameToDisplay[username])
          .sort((a, b) => b[1] - a[1]);
          let myRankGlobal = allSaldoArray.findIndex(([username]) => username === myUsername) + 1;

          teksGlobal += `*━━━━━━━━━━━━━━━━━━━━*\n`;
          teksGlobal += `*💳 SALDO ANDA :*\n`;
          if (myUsername) {
            teksGlobal += `*👤 Username : @${myUsername}*\n`;
            teksGlobal += `*💰 Rp${mySaldoGlobal.toLocaleString()}*\n`;
            if (myRankGlobal > 0) {
              teksGlobal += `*📊 Peringkat global : #${myRankGlobal} dari ${totalUserGlobal} user*\n`;
            } else {
              teksGlobal += `*📊 Peringkat : Belum punya saldo*\n`;
            }
          } else {
            teksGlobal += `*❌ Anda belum login!*\n*📌 Ketik /login di private chat untuk mendaftar*\n`;
            if (myUsername) mentionsGlobal.push(pengirim);
          }

          teksGlobal += `\n*📌 Main slot, investasi saham, bitcoin, emas, atau mancing untuk menambah saldo!*\n*📌 Transfer saldo dengan /tfsaldo @user [jumlah]*\n\n`;
          teksGlobal += `*_© 2026 Kaelorix. All Right Reserved_*`;

          await socket.sendMessage(idChat, {
            text: teksGlobal,
            mentions: mentionsGlobal
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TOPGLOBAL ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mengambil data leaderboard global!*\n\n*Error: " + err.message + "*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "changename":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            let currentName = users[pengirim].displayName;
            await socket.sendMessage(idChat, {
              text: `*📝 DISPLAY NAME SAAT INI*\n\n*📛 ${currentName}*\n\n*📌 /changename [nama baru]*\n*📌 Contoh : /changename Kaelorix 🚀*\n*📌 Maksimal 30 karakter*`
            }, {
              quoted: pesan
            });
            break;
          }

          let newName = args.join(" ").trim();

          if (newName.length < 1) {
            await socket.sendMessage(idChat, {
              text: "*❌ Display name tidak boleh kosong!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (newName.length > 30) {
            await socket.sendMessage(idChat, {
              text: "*❌ Display name maksimal 30 karakter!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek karakter berbahaya
          if (/[<>{}[\]\\|`~!@#$%^&*()=+]/.test(newName)) {
            await socket.sendMessage(idChat, {
              text: "*❌ Display name mengandung karakter yang tidak diizinkan!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (newName.includes("☑︎")) {
            await socket.sendMessage(idChat, {
              text: "*❌ Display name tidak boleh mengandung simbol ☑︎!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Update display name
          users[pengirim].displayName = newName;
          saveDB("./lib/database/users.json", users);

          let verifiedIcon = verifiedData.verifiedUsers.includes(users[pengirim].username) ? ` ${verifiedData.settings.badgeIcon}`: "";

          await socket.sendMessage(idChat, {
            text: `*✅ DISPLAY NAME BERHASIL DIUBAH!*\n\n*📛 Nama lama : ${users[pengirim].displayName}*\n*📛 Nama baru : ${newName}${verifiedIcon}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CHANGENAME ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mengubah display name!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "stokbtc":
        try {
          let persenStok = (jumlahBtc.totalStock / 21000000) * 100;
          let stokHabis = jumlahBtc.totalStock <= 0;

          let teks = `*₿ STOK BITCOIN* ₿\n\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n`;
          teks += `*📦 Stok tersisa : ${jumlahBtc.totalStock.toLocaleString(undefined, {
            minimumFractionDigits: 4, maximumFractionDigits: 8
          })} BTC*\n`;
          teks += `*📊 Persentase : ${persenStok.toFixed(2)}% dari total stok*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          if (stokHabis) {
            teks += `*⚠️ STOK HABIS! Tidak bisa membeli Bitcoin lagi.*\n`;
          } else if (jumlahBtc.totalStock < 100) {
            teks += `*⚠️ STOK TERSISA SEDIKIT! Segera beli sebelum habis!*\n`;
          } else if (jumlahBtc.totalStock < 200) {
            teks += `*⚠️ Stok mulai menipis!*\n`;
          } else {
            teks += `*✅ Stok masih aman.*\n`;
          }

          teks += `\n*💰 Harga BTC saat ini : Rp${hargaBitcoin.toLocaleString()}/BTC*\n`;
          teks += `*📌 /belibtc [jumlah] - Beli Bitcoin*\n`;
          teks += `*📌 /jualbtc [jumlah] - Jual Bitcoin*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("STOKBTC ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal cek stok BTC!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "profile":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }
          let targetUsername = null;
          let targetUserId = null;

          // Cek apakah ada mention atau argumen username
          let mentionProfile = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionProfile && users[mentionProfile]) {
            targetUserId = mentionProfile;
            targetUsername = users[targetUserId].username;
          } else if (args[0]) {
            targetUsername = args[0].toLowerCase();
            targetUserId = getUserIdByUsername(targetUsername);
          } else {
            targetUserId = pengirim;
            targetUsername = users[pengirim]?.username;
          }

          if (!targetUserId || !users[targetUserId]) {
            await socket.sendMessage(idChat, {
              text: `*❌ User tidak ditemukan!*\n*📌 Ketik /login untuk daftar.*`
            }, {
              quoted: pesan
            });
            break;
          }

          let user = users[targetUserId];
          let saldo = globalSaldo[user.username] || 0;
          let fish = globalFishInventory[user.username];
          let village = globalVillages[user.username];
          let social = socialData.users[user.username] || {
            followers: [],
            following: [],
            friends: []
          };

          let verifiedIcon = verifiedData.verifiedUsers.includes(user.username) ? `✅ *TERVERIFIKASI* ✅\n`: "";
          let verifiedLogo = verifiedData.verifiedUsers.includes(user.username) ? `*${verifiedData.settings.badgeIcon}*`: "";

          let levelEmoji = user.level >= 10 ? "👑": user.level >= 5 ? "⚔️": "🛡️";

          let teks = `*${levelEmoji} PROFIL ${user.displayName.toUpperCase()} ${levelEmoji}*\n\n`;
          teks += `${verifiedIcon}`;
          teks += `*👤 Username : @${user.username}*\n`;
          teks += `*📛 Display : ${user.displayName}* ${verifiedLogo}\n`;
          teks += `*📝 Bio : ${user.bio || "Belum ada bio"}*\n\n`;
          teks += `*💰 SALDO : Rp${saldo.toLocaleString()}*\n`;
          teks += `*🎣 TOTAL IKAN : ${fish?.totalFish || 0} ekor*\n`;
          teks += `*🏰 TOWN HALL : ${village?.townHall || 1}*\n`;
          teks += `*🏆 TROPHIES : ${village?.trophies || 1000}*\n\n`;
          teks += `*👥 SOSIAL :*\n`;
          teks += `*👤 Followers : ${social.followers?.length || 0}*\n`;
          teks += `*📌 Following : ${social.following?.length || 0}*\n`;
          teks += `*🤝 Friends : ${social.friends?.length || 0}*\n\n`;

          if (targetUserId === pengirim) {
            teks += `\n*📌 COMMAND :*\n`;
            teks += `*/changename [nama baru] - Ganti display name*\n`;
            teks += `*/setbio [bio] - Ganti bio*\n`;
            teks += `*/ceksaldo - Cek saldo*\n`;
            teks += `*/village - Lihat desa*\n`;
            teks += `*/listfish - Lihat koleksi ikan*`;
          }

          socket.sendMessage(idChat, {
            text: teks, mentions: [targetUserId]
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("PROFILE ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil profil!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "logout":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda belum login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let userData = users[pengirim];

          // ✅ UBAH JID MENJADI "Tak dikenal" (bukan hapus)
          users["Tak dikenal"] = userData;
          delete users[pengirim];
          saveDB("./lib/database/users.json", users);

          await socket.sendMessage(idChat, {
            text: `*✅ LOGOUT BERHASIL!* ✅\n\n*👤 Akun @${username} telah dikeluarkan dari perangkat ini.*\n*📌 Ketik /register untuk membuat akun baru atau /login login [username] [password] untuk login ulang.*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("LOGOUT ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal logout!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "listcentang":
        try {
          if (verifiedData.verifiedUsers.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📋 DAFTAR USER CENTANG*\n\n*✅ Belum ada user yang memiliki centang resmi.*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*✅ DAFTAR USER CENTANG RESMI* ✅\n\n`;
          teks += `*📊 Total : ${verifiedData.verifiedUsers.length} user*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          for (let i = 0; i < verifiedData.verifiedUsers.length; i++) {
            let username = verifiedData.verifiedUsers[i];
            let userId = getUserIdByUsername(username);
            let displayName = userId ? (users[userId]?.displayName || username): username;
            let verifiedLogo = verifiedData.verifiedUsers.includes(user.username) ? `*${verifiedData.settings.badgeIcon}*`: "";

            teks += `${i + 1}. *${displayName}* ${verifiedLogo} *(@${username})*\n`;
          }

          teks += `\n*📌 User dengan centang resmi mendapatkan "${verifiedData.settings.badgeIcon}" di samping nama.*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("LISTCENTANG ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil daftar centang!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "crypto":
        try {
          let teks = `*📊 DAFTAR ASET CRYPTO & EMAS* 📊\n\n`;

          // EMAS
          let emasChange = ((hargaEmas - HARGA_AWAL_EMAS) / HARGA_AWAL_EMAS * 100).toFixed(2);
          let emasIcon = emasChange >= 0 ? "📈": "📉";
          teks += `🪙 *EMAS*\n`;
          teks += `   *💰 Rp${hargaEmas.toLocaleString()}/gram*\n`;
          teks += `   *${emasIcon} ${Math.abs(emasChange)}%*\n`;
          teks += `   *📌 Minimal beli : Rp10.000*\n`;
          teks += `   *📌 Pajak jual : 2%*\n`;
          teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;

          // BTC
          let btcChange = ((hargaBitcoin - HARGA_AWAL_BITCOIN) / HARGA_AWAL_BITCOIN * 100).toFixed(2);
          let btcIcon = btcChange >= 0 ? "📈": "📉";
          teks += `₿ *BTC* (Bitcoin)\n`;
          teks += `   *💰 Rp${hargaBitcoin.toLocaleString()}/BTC*\n`;
          teks += `   *${btcIcon} ${Math.abs(btcChange)}%*\n`;
          teks += `   *📌 Minimal beli : Rp100.000*\n`;
          teks += `   *📌 Pajak jual : 2%*\n`;
          teks += `   *📦 Stok tersisa : ${jumlahBtc.totalStock?.toLocaleString() || "500"} BTC*\n`;
          teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;

          // Aset crypto lain (ETH, SOL, dll)
          for (let [symbol, asset] of Object.entries(cryptoData.assets)) {
            let change = ((asset.currentPrice - (asset.initialPrice || asset.currentPrice)) / (asset.initialPrice || asset.currentPrice) * 100).toFixed(2);
            let changeIcon = change >= 0 ? "📈": "📉";
            teks += `*${asset.icon} ${symbol} (${asset.name})*\n`;
            teks += `   *💰 Rp${asset.currentPrice.toLocaleString()}*\n`;
            teks += `   *${changeIcon} ${Math.abs(change)}%*\n`;
            teks += `   *📌 Minimal beli : Rp${asset.minBuy.toLocaleString()}*\n`;
            teks += `   *📌 Pajak jual : ${asset.tax * 100}%*\n`;
            teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          }

          teks += `*📌 COMMAND :*\n`;
          teks += `• */harga [aset] - Cek detail harga aset*\n`;
          teks += `• */beli [aset] [nominal] - Beli aset*\n`;
          teks += `• */jual [aset] [jumlah/all] - Jual aset*\n`;
          teks += `• */cek [aset] - Cek portfolio aset*\n`;
          teks += `• *Contoh : /harga BTC*\n`;
          teks += `• *Contoh : /beli ETH 100000*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CRYPTO ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan daftar aset!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "harga":
        try {
          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /harga [aset]\n*📌 Contoh: /harga BTC\n*📌 Contoh: /harga EMAS\n*📌 Contoh: /harga ETH*\n\n*📌 Cek /crypto untuk lihat semua aset*"
            }, {
              quoted: pesan
            });
            break;
          }

          let aset = args[0].toUpperCase();

          if (aset === "EMAS") {
            let lastUpdate = hargaDb.lastUpdate || Date.now();
            let nextUpdate = lastUpdate + 60000;
            let sisaWaktu = nextUpdate - Date.now();
            let detikWaktu = Math.ceil(sisaWaktu / 1000);
            if (detikWaktu < 0) detikWaktu = 0;

            let change = ((hargaEmas - HARGA_AWAL_EMAS) / HARGA_AWAL_EMAS * 100).toFixed(2);
            let changeIcon = change >= 0 ? "📈": "📉";

            await socket.sendMessage(idChat, {
              text: `*🪙 HARGA EMAS* 🪙\n\n*💰 Harga saat ini : Rp${hargaEmas.toLocaleString()}/gram*\n*📊 Perubahan : ${changeIcon} ${Math.abs(change)}%*\n*⏰ Update berikutnya : ${detikWaktu} detik*\n*🔄 Volatilitas : 0.1% - 5%*\n\n*💰 Minimal beli : Rp10.000*\n*📉 Pajak jual : 2%*\n*🏦 Stok : Tidak terbatas*\n\n*📌 /beli EMAS [nominal] - Beli emas*\n*📌 /jual emas [gram/all] - Jual emas*\n*📌 /cek emas - Cek portfolio emas*`
            }, {
              quoted: pesan
            });
          } else if (aset === "BTC") {
            let lastUpdate = hargaDb.lastUpdate || Date.now();
            let nextUpdate = lastUpdate + 60000;
            let sisaWaktu = nextUpdate - Date.now();
            let detikWaktu = Math.ceil(sisaWaktu / 1000);
            if (detikWaktu < 0) detikWaktu = 0;

            let change = ((hargaBitcoin - HARGA_AWAL_BITCOIN) / HARGA_AWAL_BITCOIN * 100).toFixed(2);
            let changeIcon = change >= 0 ? "📈": "📉";
            let stokPersen = (jumlahBtc.totalStock / 21000000) * 100;

            await socket.sendMessage(idChat, {
              text: `*₿ HARGA BITCOIN* ₿\n\n*💰 Harga saat ini : Rp${hargaBitcoin.toLocaleString()}/BTC*\n*📊 Perubahan : ${changeIcon} ${Math.abs(change)}%*\n*⏰ Update berikutnya : ${detikWaktu} detik*\n*🔄 Volatilitas : 0.1% - 5%*\n\n*💰 Minimal beli : Rp100.000*\n*📉 Pajak jual : 2%*\n*📦 Stok tersisa : ${jumlahBtc.totalStock.toLocaleString(undefined, {
                minimumFractionDigits: 4, maximumFractionDigits: 8
              })} BTC*\n\n*📌 /beli BTC [nominal] - Beli BTC*\n*📌 /jual BTC [jumlah/all] - Jual BTC*\n*📌 /cekas BTC - Cek portfolio BTC*`
            }, {
              quoted: pesan
            });
          } else {
            let assetData = cryptoData.assets[aset];
            if (!assetData) {
              await socket.sendMessage(idChat, {
                text: `*❌ Aset "${aset}" tidak ditemukan!*\n*📌 Cek /crypto untuk lihat daftar*`
              }, {
                quoted: pesan
              });
              break;
            }

            let lastUpdate = cryptoData.priceHistory[aset]?.[0]?.time || Date.now();
            let nextUpdate = lastUpdate + 60000;
            let sisaWaktu = nextUpdate - Date.now();
            let detikWaktu = Math.ceil(sisaWaktu / 1000);
            if (detikWaktu < 0) detikWaktu = 0;

            let initialPrice = assetData.initialPrice || assetData.currentPrice;
            let change = ((assetData.currentPrice - initialPrice) / initialPrice * 100).toFixed(2);
            let changeIcon = change >= 0 ? "📈": "📉";

            await socket.sendMessage(idChat, {
              text: `*${assetData.icon} HARGA ${assetData.name}* ${assetData.icon}\n\n*💰 Harga saat ini : Rp${assetData.currentPrice.toLocaleString()}*\n*📊 Perubahan : ${changeIcon} ${Math.abs(change)}%*\n*⏰ Update berikutnya : ${detikWaktu} detik*\n*🔄 Volatilitas : 0.1% - ${assetData.volatility}%\n\n*💰 Minimal beli : Rp${assetData.minBuy.toLocaleString()}*\n*📉 Pajak jual : ${assetData.tax * 100}%*\n*🏦 Stok : Tidak terbatas*\n\n*📌 /beli ${aset} [nominal] - Beli ${assetData.name}*\n*📌 /jual ${aset} [jumlah/all] - Jual ${assetData.name}*\n*📌 /cekas ${aset} - Cek portfolio ${assetData.name}*`
            }, {
              quoted: pesan
            });
          }

        } catch (err) {
          console.log("HARGA ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil harga!*"
          }, {
            quoted: pesan
          });
        }
        break;
        // ===================== SISTEM PERBANKAN (PRIVATE CHAT ONLY) =====================
      case "buatrek":
        try {
          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*🔐 Buat rekening hanya bisa dilakukan di private chat bot!*\n\n*📌 Klik nama bot dan pilih 'Chat' untuk memulai.*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          // Cek apakah sudah punya rekening
          let existingAccount = Object.values(bankData.accounts).find(acc => acc.owner === username);
          if (existingAccount) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda sudah memiliki rekening!*\n\n*📌 /cekbank [password] - Cek rekening Anda*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Set state
          bankState[pengirim] = {
            action: "BUATREK_WAIT_PASSWORD"
          };

          await socket.sendMessage(idChat, {
            text: "*🏦 BUAT REKENING BARU* 🏦\n\n*🔐 Masukkan password untuk rekening Anda:*\n*📌 Minimal 4 karakter*\n*📌 Simpan password ini baik-baik!*\n\n*Ketik /batal untuk membatalkan.*"
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BUATREK ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "deposit":
        try {
          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*🔐 Deposit hanya bisa dilakukan di private chat bot!*\n\n*📌 Klik nama bot dan pilih 'Chat' untuk memulai.*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          // Set state
          bankState[pengirim] = {
            action: "DEPOSIT_WAIT_PASSWORD"
          };

          await socket.sendMessage(idChat, {
            text: "*💰 DEPOSIT TUNAI* 💰\n\n*🔐 Masukkan password rekening Anda:*\n\n*Ketik /batal untuk membatalkan.*"
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("DEPOSIT ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "withdraw":
        try {
          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*🔐 Withdraw hanya bisa dilakukan di private chat bot!*\n\n*📌 Klik nama bot dan pilih 'Chat' untuk memulai.*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          // Set state
          bankState[pengirim] = {
            action: "WITHDRAW_WAIT_PASSWORD"
          };

          await socket.sendMessage(idChat, {
            text: "*💸 WITHDRAW TUNAI* 💸\n\n*🔐 Masukkan password rekening Anda:*\n\n*Ketik /batal untuk membatalkan.*"
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("WITHDRAW ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "cekbank":
        try {
          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*🔐 Cek rekening hanya bisa dilakukan di private chat bot!*\n\n*📌 Klik nama bot dan pilih 'Chat' untuk memulai.*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          // Set state
          bankState[pengirim] = {
            action: "CEKBANK_WAIT_PASSWORD"
          };

          await socket.sendMessage(idChat, {
            text: "*🏦 CEK REKENING* 🏦\n\n*🔐 Masukkan password rekening Anda:*\n\n*Ketik /batal untuk membatalkan.*"
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CEKBANK ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "transferbank":
        try {
          if (dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*🔐 Transfer hanya bisa dilakukan di private chat bot!*\n\n*📌 Klik nama bot dan pilih 'Chat' untuk memulai.*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          // Set state
          bankState[pengirim] = {
            action: "TRANSFER_WAIT_PASSWORD"
          };

          await socket.sendMessage(idChat, {
            text: "*💸 TRANSFER ANTAR REKENING* 💸\n\n*🔐 Masukkan password rekening Anda (sumber dana):*\n\n*Ketik /batal untuk membatalkan.*"
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TRANSFERBANK ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "batal":
        try {
          if (bankState[pengirim]) {
            delete bankState[pengirim];
            await socket.sendMessage(idChat, {
              text: "*✅ Transaksi dibatalkan!*"
            }, {
              quoted: pesan
            });
          } else {
            await socket.sendMessage(idChat, {
              text: "*❌ Tidak ada transaksi aktif!*"
            }, {
              quoted: pesan
            });
          }
        } catch (err) {
          console.log("BATAL ERROR:", err);
        }
        break;

      case "miningbtc":
        try {
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            let status = jumlahBtc.miningActive ? "🟢 AKTIF": "🔴 NONAKTIF";
            await socket.sendMessage(idChat, {
              text: `*⛏️ MINING STOK BTC* ⛏️\n\n*Status : ${status}*\n*⏱️ Kecepatan : +0.00000001 BTC/detik*\n*📦 Total dimining : ${jumlahBtc.totalMined.toFixed(8)} BTC*\n*💰 Stok saat ini : ${jumlahBtc.totalStock.toFixed(8)} BTC*\n\n*📌 /miningbtc on - Nyalakan*\n*📌 /miningbtc off - Matikan*`
            }, {
              quoted: pesan
            });
            break;
          }

          let action = args[0].toLowerCase();

          if (action === "on") {
            if (jumlahBtc.miningActive) {
              await socket.sendMessage(idChat, {
                text: "*⛏️ Mining stok sudah aktif!*"
              }, {
                quoted: pesan
              });
              break;
            }

            jumlahBtc.miningActive = true;
            saveDB("./lib/database/globalBtc.json", jumlahBtc);
            startMiningStok();

            await socket.sendMessage(idChat, {
              text: "*✅ MINING STOK BTC DIAKTIFKAN!*"
            }, {
              quoted: pesan
            });

          } else if (action === "off") {
            if (!jumlahBtc.miningActive) {
              await socket.sendMessage(idChat, {
                text: "*⛏️ Mining stok sedang tidak aktif!*"
              }, {
                quoted: pesan
              });
              break;
            }

            jumlahBtc.miningActive = false;
            saveDB("./lib/database/globalBtc.json", jumlahBtc);
            stopMiningStok();

            await socket.sendMessage(idChat, {
              text: "*🛑 MINING STOK BTC DINONAKTIFKAN!*"
            }, {
              quoted: pesan
            });
          }

        } catch (err) {
          console.log("MININGBTC ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "pinjam":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || isNaN(args[0])) {
            await socket.sendMessage(idChat, {
              text: `*💰 SISTEM PINJAMAN* 💰\n\n*📌 /pinjam [jumlah]*\n*📌 Contoh: /pinjam 100000*\n\n*⚙️ ATURAN:*\n• Minimal pinjam : Rp${pinjamanData.settings.minLoan.toLocaleString()}\n• Maksimal pinjam : Rp${pinjamanData.settings.maxLoan.toLocaleString()}\n• Bunga: ${pinjamanData.settings.interestRate * 100}%\n• Tenggat : 24 jam\n• Denda: Mute akun jika telat bayar`
            }, {
              quoted: pesan
            });
            break;
          }

          let amount = parseInt(args[0]);

          if (amount < pinjamanData.settings.minLoan) {
            await socket.sendMessage(idChat, {
              text: `*❌ Minimal pinjam Rp${pinjamanData.settings.minLoan.toLocaleString()}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (amount > pinjamanData.settings.maxLoan) {
            await socket.sendMessage(idChat, {
              text: `*❌ Maksimal pinjam Rp${pinjamanData.settings.maxLoan.toLocaleString()}!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek apakah masih punya pinjaman aktif
          if (pinjamanData.loans[username] && pinjamanData.loans[username].status === "ACTIVE") {
            let loan = pinjamanData.loans[username];
            let sisaWaktu = loan.dueDate - Date.now();
            let jam = Math.ceil(sisaWaktu / (1000 * 60 * 60));

            await socket.sendMessage(idChat, {
              text: `*❌ ANDA MASIH MEMILIKI PINJAMAN AKTIF!*\n\n*💰 Jumlah: Rp${loan.amount.toLocaleString()}*\n*📅 Tenggat: ${jam} jam lagi*\n*📌 /bayarpinjam - Untuk melunasi*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Proses pinjaman
          let interest = Math.floor(amount * pinjamanData.settings.interestRate);
          let totalPay = amount + interest;

          globalSaldo[username] = (globalSaldo[username] || 0) + amount;

          pinjamanData.loans[username] = {
            amount: amount,
            interest: interest,
            totalPay: totalPay,
            loanDate: Date.now(),
            dueDate: Date.now() + pinjamanData.settings.loanDuration,
            status: "ACTIVE"
          };

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/pinjaman.json", pinjamanData);

          await socket.sendMessage(idChat, {
            text: `*✅ PINJAMAN BERHASIL!* ✅\n\n*💰 Jumlah pinjam : +Rp${amount.toLocaleString()}*\n*📈 Bunga (${pinjamanData.settings.interestRate * 100}%) : Rp${interest.toLocaleString()}*\n*💳 Total harus dibayar: Rp${totalPay.toLocaleString()}*\n*⏰ Tenggat : 24 jam*\n*💳 Saldo Anda : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n*📌 /bayarpinjam - Untuk melunasi*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("PINJAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal meminjam!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "bayarpinjam":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let loan = pinjamanData.loans[username];

          if (!loan || loan.status !== "ACTIVE") {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda tidak memiliki pinjaman aktif!*\n*📌 /pinjam untuk meminjam*"
            }, {
              quoted: pesan
            });
            break;
          }

          let userSaldo = globalSaldo[username] || 0;
          let isLate = Date.now() > loan.dueDate;
          let denda = isLate ? Math.floor(loan.totalPay * 0.2): 0;
          let totalBayar = loan.totalPay + denda;

          if (userSaldo < totalBayar) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Harus dibayar : Rp${totalBayar.toLocaleString()}*\n*📉 Saldo Anda : Rp${userSaldo.toLocaleString()}*\n*💸 Kekurangan : Rp${(totalBayar - userSaldo).toLocaleString()}*\n\n*⚠️ Jika tidak dibayar dalam 24 jam, akun akan di-MUTE!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Proses pembayaran
          globalSaldo[username] -= totalBayar;
          loan.status = "PAID";
          loan.paidDate = Date.now();

          // Hapus dari muted jika ada
          if (isMuted(pengirim)) {
            unmuteUser(pengirim);
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/pinjaman.json", pinjamanData);

          let dendaText = denda > 0 ? `\n*⚠️ Denda keterlambatan : Rp${denda.toLocaleString()}*`: "";

          await socket.sendMessage(idChat, {
            text: `*✅ PINJAMAN LUNAS!* ✅\n\n*💰 Dibayar : Rp${totalBayar.toLocaleString()}*${dendaText}\n*💳 Sisa saldo : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n\n*📌 Terima kasih telah melunasi pinjaman!*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BAYARPINJAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal membayar!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "cekpinjam":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let loan = pinjamanData.loans[username];

          if (!loan || loan.status !== "ACTIVE") {
            await socket.sendMessage(idChat, {
              text: "*📋 STATUS PINJAMAN*\n\n*❌ Anda tidak memiliki pinjaman aktif!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let sisaWaktu = loan.dueDate - Date.now();
          let jam = Math.floor(sisaWaktu / (1000 * 60 * 60));
          let menit = Math.floor((sisaWaktu % (1000 * 60 * 60)) / (1000 * 60));
          let isLate = sisaWaktu < 0;

          let teks = `*📋 STATUS PINJAMAN* 📋\n\n`;
          teks += `*💰 Pinjaman : Rp${loan.amount.toLocaleString()}*\n`;
          teks += `*📈 Bunga : Rp${loan.interest.toLocaleString()}*\n`;
          teks += `*💳 Total harus dibayar : Rp${loan.totalPay.toLocaleString()}*\n`;

          if (isLate) {
            teks += `*⚠️ STATUS : TERLAMBAT!*\n`;
            teks += `*⏰ Sudah melebihi tenggat*\n`;
            teks += `*📌 Segera bayar sebelum akun di-MUTE!*\n`;
          } else {
            teks += `*⏰ Sisa waktu : ${jam} jam ${menit} menit*\n`;
          }

          teks += `\n*📌 /bayarpinjam - Untuk melunasi*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("CEKINJAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal cek pinjaman!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "banuser":
        try {
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /banuser [username] / @user*\n*📌 Contoh: /banuser kaelorix*"
            }, {
              quoted: pesan
            });
            break;
          }

          let targetUsername = null;
          let mentionJid = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionJid && users[mentionJid]) {
            targetUsername = users[mentionJid].username;
          } else {
            targetUsername = args[0].toLowerCase().replace(/^@/, '');
          }

          let targetUserId = getUserIdByUsername(targetUsername);
          if (!targetUserId) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (isMuted(targetUserId)) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} sudah di-MUTE!*`
            }, {
              quoted: pesan
            });
            break;
          }

          muteUser(targetUserId);

          await socket.sendMessage(idChat, {
            text: `*✅ USER @${targetUsername} BERHASIL DI-MUTE!* ✅\n\n*🔇 User tidak bisa menggunakan bot sampai di-unmute.*`,
            mentions: [targetUserId]
          }, {
            quoted: pesan
          });

          await socket.sendMessage(targetUserId, {
            text: `*🔇 AKUN ANDA TELAH DI BEKUKAN!*\n\n*⚠️ Anda tidak bisa menggunakan bot sampai owner membuka kembali akunmu.*\n*📌 Hubungi owner untuk informasi lebih lanjut.*`
          }).catch(() => {});

        } catch (err) {
          console.log("BANUSER ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mem-mute user!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "unbanuser":
        try {
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /unbanuser [username] / @user*\n*📌 Contoh: /unbanuser kaelorix*"
            }, {
              quoted: pesan
            });
            break;
          }

          let targetUsername = null;
          let mentionJid = pesan.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

          if (mentionJid && users[mentionJid]) {
            targetUsername = users[mentionJid].username;
          } else {
            targetUsername = args[0].toLowerCase().replace(/^@/, '');
          }

          let targetUserId = getUserIdByUsername(targetUsername);
          if (!targetUserId) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (!isMuted(targetUserId)) {
            await socket.sendMessage(idChat, {
              text: `*❌ User @${targetUsername} tidak sedang di-MUTE!*`
            }, {
              quoted: pesan
            });
            break;
          }

          unmuteUser(targetUserId);

          await socket.sendMessage(idChat, {
            text: `*✅ USER @${targetUsername} BERHASIL DI-UNMUTE!* ✅\n\n*🔓 User sudah bisa menggunakan bot kembali.*`,
            mentions: [targetUserId]
          }, {
            quoted: pesan
          });

          await socket.sendMessage(targetUserId, {
            text: `*🔓 AKUN ANDA TELAH DI-UNMUTE!*\n\n*✅ Anda sudah bisa menggunakan bot kembali.*`
          }).catch(() => {});

        } catch (err) {
          console.log("UNBANUSER ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mem-unmute user!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "listmute":
        try {
          if (!isOwner) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus owner!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (pinjamanData.mutedUsers.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*📋 DAFTAR USER MUTE*\n\n*✅ Tidak ada user yang sedang di-MUTE!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*🔇 DAFTAR USER MUTE* 🔇\n\n`;
          teks += `*📊 Total : ${pinjamanData.mutedUsers.length} user*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;

          for (let i = 0; i < pinjamanData.mutedUsers.length; i++) {
            let userId = pinjamanData.mutedUsers[i];
            let user = users[userId];
            let username = user?.username || userId.split("@")[0];
            let displayName = user?.displayName || username;

            let loan = pinjamanData.loans[username];
            let amount = loan?.totalPay?.toLocaleString() || "?";

            teks += `${i + 1}. *${displayName}* (@${username})\n`;
            teks += `   💰 Tunggakan : Rp${amount}\n`;
            teks += `   📌 /unbanuser ${username} - Buka mute\n\n`;
          }

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("LISTMUTE ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal ambil daftar mute!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "banklist":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*🏦 DAFTAR BANK USER* 🏦\n\n`;
          let found = false;

          // Hanya bank milik user (type Perbankan)
          for (let [kode, company] of Object.entries(globalSaham.companyStocks)) {
            if (company.sector === "bank") {
              found = true;
              let stock = globalSaham.stocks[kode] || company;
              let interest = company.companyData?.bankData?.interestRate || 0.5;
              let totalDeposit = company.companyData?.bankData?.totalDeposit || 0;

              teks += `${company.icon} *${kode}* - ${company.name}\n`;
              teks += `   *👤 Pemilik : @${company.owner}*\n`;
              teks += `   *💰 Harga saham : Rp${(stock.currentPrice || company.initialPrice).toLocaleString()}/lembar*\n`;
              teks += `   *💵 Total deposit : Rp${totalDeposit.toLocaleString()}*\n`;
              teks += `   *📈 Bunga : ${interest}% per hari*\n`;
              teks += `   *📌 /bankinfo ${kode} - Lihat detail bank*\n`;
              teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;
            }
          }

          if (!found) {
            teks += `*❌ Belum ada bank user yang berdiri!*\n*📌 Jadilah yang pertama dengan /buatperusahaan "Nama Bank" KODE bank*`;
          }

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BANKLIST ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan daftar bank!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "bankinfo":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ /bankinfo [kode bank]\n*📌 Contoh: /bankinfo BANK*"
            }, {
              quoted: pesan
            });
            break;
          }

          let bankCode = args[0].toUpperCase();
          let bank = globalSaham.companyStocks[bankCode];

          if (!bank || bank.sector !== "bank") {
            await socket.sendMessage(idChat, {
              text: `*❌ Bank dengan kode "${bankCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // ✅ PASTIKAN bankData ADA
          if (!bank.companyData.bankData) {
            bank.companyData.bankData = {
              totalDeposit: 0,
              interestRate: 0.5,
              loanRate: 2.0,
              badLoan: 0,
              customerDeposits: {}
            };
            saveDB("./lib/database/globalSaham.json", globalSaham);
          }

          let username = users[pengirim].username;
          let bankData = bank.companyData.bankData;
          let userDeposit = bankData.customerDeposits?.[username] || 0;
          let stock = globalSaham.stocks[bankCode] || bank;
          let stockPrice = stock.currentPrice || bank.initialPrice;

          let teks = `*🏦 INFO BANK ${bank.name}* 🏦\n\n`;
          teks += `*🆔 Kode : ${bankCode}*\n`;
          teks += `*👤 Pemilik : @${bank.owner}*\n`;
          teks += `*💰 Harga saham : Rp${stockPrice.toLocaleString()}/lembar*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n`;
          teks += `*📊 STATISTIK BANK :*\n`;
          teks += `*💰 Total deposit : Rp${(bankData.totalDeposit || 0).toLocaleString()}*\n`;
          teks += `*📈 Bunga : ${bankData.interestRate || 0.5}% per hari*\n`;
          teks += `*💸 Pinjaman bermasalah : Rp${(bankData.badLoan || 0).toLocaleString()}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n`;
          teks += `*👤 DEPOSIT ANDA :*\n`;
          teks += `*💰 Rp${userDeposit.toLocaleString()}*\n`;
          teks += `*📈 Bunga/hari : Rp${Math.floor(userDeposit * (bankData.interestRate || 0.5) / 100).toLocaleString()}*\n`;
          teks += `*━━━━━━━━━━━━━━━━━━━━*\n`;
          teks += `*📌 COMMAND :*\n`;
          teks += `*• /bankdeposit ${bankCode} [jumlah] - Deposit uang*\n`;
          teks += `*• /bankwithdraw ${bankCode} [jumlah/all] - Tarik uang*\n`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BANKINFO ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;
        break;

      case "bankdeposit":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ /bankdeposit [kode] [jumlah]\n*📌 Contoh : /bankdeposit BANK 100000*"
            }, {
              quoted: pesan
            });
            break;
          }

          let bankCode = args[0].toUpperCase();
          let amount = parseInt(args[1]);

          let bank = globalSaham.companyStocks[bankCode];

          if (!bank || bank.sector !== "bank") {
            await socket.sendMessage(idChat, {
              text: `*❌ Bank "${bankCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // ✅ PASTIKAN bankData ADA
          if (!bank.companyData.bankData) {
            bank.companyData.bankData = {
              totalDeposit: 0,
              interestRate: 0.5,
              loanRate: 2.0,
              badLoan: 0,
              customerDeposits: {}
            };
          }

          if (amount < 10000) {
            await socket.sendMessage(idChat, {
              text: "*❌ Minimal deposit Rp10.000!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let userSaldo = globalSaldo[username] || 0;
          if (userSaldo < amount) {
            await socket.sendMessage(idChat, {
              text: `*❌ Saldo tidak cukup! Butuh Rp${amount.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          globalSaldo[username] -= amount;

          if (!bank.companyData.bankData.customerDeposits) {
            bank.companyData.bankData.customerDeposits = {};
          }

          bank.companyData.bankData.customerDeposits[username] = (bank.companyData.bankData.customerDeposits[username] || 0) + amount;
          bank.companyData.bankData.totalDeposit = (bank.companyData.bankData.totalDeposit || 0) + amount;
          bank.companyData.cash = (bank.companyData.cash || 0) + amount;

          let stock = globalSaham.stocks[bankCode];
          if (stock) {
            let totalDeposit = bank.companyData.bankData.totalDeposit || 1;
            let increase = Math.min(amount / totalDeposit * 5, 10);
            stock.currentPrice = Math.floor(stock.currentPrice * (1 + increase / 100));
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*✅ DEPOSIT BERHASIL!* ✅\n\n*🏦 Bank : ${bank.name} (${bankCode})*\n*💰 Jumlah : +Rp${amount.toLocaleString()}*\n*💳 Total deposit Anda : Rp${bank.companyData.bankData.customerDeposits[username].toLocaleString()}*\n*💵 Sisa saldo : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n*📈 Bunga : ${bank.companyData.bankData.interestRate}% per hari*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BANKDEPOSIT ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal deposit!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "bankwithdraw":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1]) {
            await socket.sendMessage(idChat, {
              text: "*❌ /bankwithdraw [kode] [jumlah/all]\n*📌 Contoh: /bankwithdraw BANK 50000*\n*📌 Contoh: /bankwithdraw BANK all*"
            }, {
              quoted: pesan
            });
            break;
          }

          let bankCode = args[0].toUpperCase();
          let bank = globalSaham.companyStocks[bankCode];

          if (!bank || bank.sector !== "bank") {
            await socket.sendMessage(idChat, {
              text: `*❌ Bank "${bankCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          let userDeposit = bank.companyData.bankData.customerDeposits?.[username] || 0;

          if (userDeposit === 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda tidak memiliki deposit di bank ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let withdrawAmount = 0;
          let isAll = args[1].toLowerCase() === "all";

          if (isAll) {
            withdrawAmount = userDeposit;
          } else {
            withdrawAmount = parseInt(args[1]);
            if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
              await socket.sendMessage(idChat, {
                text: "*❌ Jumlah tidak valid!*"
              }, {
                quoted: pesan
              });
              break;
            }
          }

          if (withdrawAmount > userDeposit) {
            await socket.sendMessage(idChat, {
              text: `*❌ Deposit tidak cukup! Anda memiliki Rp${userDeposit.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let adminFee = Math.floor(withdrawAmount * 0.005);
          let totalWithdraw = withdrawAmount + adminFee;

          if (bank.companyData.cash < totalWithdraw) {
            await socket.sendMessage(idChat, {
              text: `*⚠️ BANK KEKURANGAN KAS!*\n\n*💰 Kas bank : Rp${bank.companyData.cash.toLocaleString()}*\n*📊 Anda minta : Rp${totalWithdraw.toLocaleString()}*\n*📌 Coba lagi nanti atau tarik jumlah lebih kecil*`
            }, {
              quoted: pesan
            });
            break;
          }

          globalSaldo[username] = (globalSaldo[username] || 0) + withdrawAmount;
          bank.companyData.bankData.customerDeposits[username] -= withdrawAmount;
          bank.companyData.bankData.totalDeposit -= withdrawAmount;
          bank.companyData.cash -= totalWithdraw;

          if (bank.companyData.bankData.customerDeposits[username] === 0) {
            delete bank.companyData.bankData.customerDeposits[username];
          }

          let stock = globalSaham.stocks[bankCode];
          if (stock) {
            let decrease = Math.min(withdrawAmount / bank.companyData.bankData.totalDeposit * 3, 5);
            stock.currentPrice = Math.floor(stock.currentPrice * (1 - decrease / 100));
            if (stock.currentPrice < stock.initialPrice * 0.1) stock.currentPrice = stock.initialPrice * 0.1;
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*✅ WITHDRAW BERHASIL!* ✅\n\n*🏦 Bank : ${bank.name} (${bankCode})*\n*💰 Jumlah : -Rp${withdrawAmount.toLocaleString()}*\n*📉 Admin fee (0.5%) : Rp${adminFee.toLocaleString()}*\n*💳 Sisa deposit : Rp${(bank.companyData.bankData.customerDeposits[username] || 0).toLocaleString()}*\n*💵 Saldo tunai : Rp${(globalSaldo[username] || 0).toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BANKWITHDRAW ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal withdraw!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "bankbunga":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ /bankbunga [kode] [persen]\n*📌 Contoh: /bankbunga BANK 0.75*\n*📌 Range: 0.1% - 2%*"
            }, {
              quoted: pesan
            });
            break;
          }

          let bankCode = args[0].toUpperCase();
          let newRate = parseFloat(args[1]);

          let bank = globalSaham.companyStocks[bankCode];

          if (!bank || bank.sector !== "bank") {
            await socket.sendMessage(idChat, {
              text: `*❌ Bank "${bankCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (bank.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Hanya pemilik bank yang bisa mengatur bunga!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (newRate < 0.1 || newRate > 2) {
            await socket.sendMessage(idChat, {
              text: "*❌ Bunga harus antara 0.1% - 2%!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let oldRate = bank.companyData.bankData.interestRate;
          bank.companyData.bankData.interestRate = newRate;

          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*✅ BUNGA BANK DIUBAH!* ✅\n\n*🏦 Bank : ${bank.name} (${bankCode})*\n*📉 Bunga lama : ${oldRate}%*\n*📈 Bunga baru: ${newRate}%\n\n*⚠️ Bunga akan berlaku mulai hari ini*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BANKBUNGA ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "perusahaanku":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;
          let myCompanies = [];

          for (let [kode, company] of Object.entries(globalSaham.companyStocks)) {
            if (company.owner === username) {
              myCompanies.push({
                kode, ...company
              });
            }
          }

          if (myCompanies.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda belum memiliki perusahaan!*\n*📌 /buatperusahaan [nama] [kode] [type]*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*🏢 PERUSAHAAN SAYA* 🏢\n\n`;

          for (let comp of myCompanies) {
            let stock = globalSaham.stocks[comp.kode];
            let currentPrice = stock?.currentPrice || comp.currentPrice;
            let value = currentPrice * comp.volume;
            let change = ((currentPrice - comp.initialPrice) / comp.initialPrice * 100).toFixed(2);
            let changeIcon = change >= 0 ? "📈": "📉";

            teks += `${comp.icon} *${comp.kode} - ${comp.name}*\n`;
            teks += `   *📦 Type : ${comp.sector}*\n`;
            teks += `   *💰 Harga : Rp${currentPrice.toLocaleString()} ${changeIcon} ${Math.abs(change)}%*\n`;
            teks += `   *📊 Total saham : ${comp.volume} lembar*\n`;
            teks += `   *💎 Nilai perusahaan : Rp${value.toLocaleString()}*\n`;
            teks += `   *💰 Kas perusahaan : Rp${comp.companyData.cash.toLocaleString()}*\n`;
            if (comp.availableShares > 0) {
              teks += `   *📈 Tersedia dijual : ${comp.availableShares} lembar*\n`;
              teks += `   *📌 /daftarbursa ${comp.kode} [harga] [nama] - Daftarkan ke bursa*\n`;
            }
            teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;
          }

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("PERUSAHAANKU ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "daftarbursa":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || !args[2]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /daftarbursa [kode] [harga] [nama panjang]*\n*📌 Contoh : /daftarbursa MAJU 15000 \"PT Maju Jaya\"*\n*💰 Biaya pendaftaran : Rp500.000*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let price = parseInt(args[1]);
          let fullName = args.slice(2).join(" ");

          let company = globalSaham.companyStocks[companyCode];

          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan dengan kode "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.availableShares < 100) {
            await socket.sendMessage(idChat, {
              text: "*❌ Minimal 100 lembar saham untuk didaftarkan!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let fee = 500000;
          if ((globalSaldo[username] || 0) < fee) {
            await socket.sendMessage(idChat, {
              text: `*❌ Saldo tidak cukup! Butuh Rp${fee.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          globalSaldo[username] -= fee;

          // Pindahkan saham dari companyStocks ke stocks (bursa utama)
          globalSaham.stocks[companyCode] = {
            name: fullName,
            sector: company.sector === "makanan" ? "Consumer Goods": (company.sector === "bank" ? "Perbankan": "Industri"),
            initialPrice: price,
            currentPrice: price,
            volume: company.availableShares,
            icon: company.icon,
            description: company.description,
            type: "company",
            owner: username,
            companyRef: companyCode
          };

          // Kurangi availableShares
          company.availableShares = 0;
          company.listedAt = Date.now();

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*✅ SAHAM BERHASIL DIDAFTARKAN KE BURSA!* ✅\n\n*🏢 Perusahaan : ${company.name}*\n*🆔 Kode : ${companyCode}*\n*💰 Harga : Rp${price.toLocaleString()}/lembar*\n*📊 Jumlah terdaftar : ${company.volume} lembar*\n\n*📌 Sekarang user lain bisa beli saham ${companyCode} dengan /belisaham ${companyCode} [lot]*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("DAFTARBURSA ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal mendaftarkan saham!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "buatperusahaan":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || !args[2]) {
            await socket.sendMessage(idChat, {
              text: "*❌ PENGGUNAAN SALAH!*\n\n*📌 /buatperusahaan [nama] [kode] [type]*\n*📌 Type: makanan, barang, bank*\n*📌 Contoh: /buatperusahaan \"Maju_Jaya\" MJU makanan*\n*💰 Biaya pendirian : Rp5.000.000.000*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek jumlah perusahaan yang sudah dimiliki user
          let userCompanyCount = 0;
          for (let [kode, company] of Object.entries(globalSaham.companyStocks)) {
            if (company.owner === username) {
              userCompanyCount++;
            }
          }

          if (userCompanyCount >= 3) {
            await socket.sendMessage(idChat, {
              text: "*❌ ANDA SUDAH MEMILIKI 5PERUSAHAAN!*\n\n*📌 Maksimal 3 perusahaan per user.*\n*📌 Hapus atau jual salah satu perusahaan Anda terlebih dahulu.*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyName = args[0];
          let companyCode = args[1].toUpperCase();
          let companyType = args[2].toLowerCase();

          let validTypes = ["makanan",
            "barang",
            "bank"];
          if (!validTypes.includes(companyType)) {
            await socket.sendMessage(idChat, {
              text: "*❌ Type harus: makanan, barang, atau bank!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek kode sudah dipakai
          if (globalSaham.stocks[companyCode] || globalSaham.companyStocks[companyCode]) {
            await socket.sendMessage(idChat, {
              text: `*❌ Kode "${companyCode}" sudah dipakai!*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek biaya
          let fee = 5000000000;
          if ((globalSaldo[username] || 0) < fee) {
            await socket.sendMessage(idChat, {
              text: `*❌ Saldo tidak cukup! Butuh Rp${fee.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Potong biaya
          globalSaldo[username] -= fee;

          // Tentukan harga awal berdasarkan type
          let initialPrice = companyType === "bank" ? 15000: (companyType === "barang" ? 10000: 5000);
          let totalShares = 1000;
          let ownerShares = 600; // Owner pegang 60%
          let availableShares = 400; // 40% dijual ke publik

          // Simpan ke companyStocks
          globalSaham.companyStocks[companyCode] = {
            name: companyName,
            owner: username,
            sector: companyType,
            initialPrice: initialPrice,
            currentPrice: initialPrice,
            volume: totalShares,
            availableShares: availableShares,
            icon: companyType === "bank" ? "🏦": (companyType === "barang" ? "📦": "🍔"),
            description: `Perusahaan ${companyType} milik @${username}`,
            type: "company",
            companyData: {
              level: 1,
              cash: 2000000,
              inventory: 0,
              production: 10,
              problem: null,
              createdAt: Date.now()
            },
            shareholders: {
              [username]: ownerShares
            }
          };

          // Owner otomatis punya saham
          if (!globalSaham.users[username]) {
            globalSaham.users[username] = {
              portfolio: {},
              totalInvest: 0,
              history: []
            };
          }
          if (!globalSaham.users[username].portfolio[companyCode]) {
            globalSaham.users[username].portfolio[companyCode] = {
              lot: 0,
              saham: 0,
              avgPrice: 0,
              totalInvest: 0
            };
          }

          let userStock = globalSaham.users[username].portfolio[companyCode];
          userStock.lot = ownerShares / 100;
          userStock.saham = ownerShares;
          userStock.avgPrice = initialPrice;
          userStock.totalInvest = ownerShares * initialPrice;

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*✅ PERUSAHAAN BERHASIL DIDIRIKAN!* ✅\n\n*🏢 Nama : ${companyName}*\n*🆔 Kode : ${companyCode}*\n*📦 Type : ${companyType}*\n*💰 Harga saham awal : Rp${initialPrice.toLocaleString()}/lembar*\n*📊 Total saham : ${totalShares} lembar*\n*👤 Saham Anda : ${ownerShares} lembar (60%)*\n*📈 Tersedia untuk publik : ${availableShares} lembar (40%)*\n\n*📌 /daftarbursa ${companyCode} ${initialPrice} \"${companyName}\" - Daftarkan ke bursa*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BUATPERUSAHAAN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal membuat perusahaan!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "company":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*🏢 GAME PERUSAHAAN* 🏢\n\n`;
          teks += `*📌 MANAJEMEN PERUSAHAAN:*\n`;
          teks += `*┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n`;
          teks += `*• /buatperusahaan [nama] [kode] [type] - Dirikan perusahaan (Rp2.000.000)*\n`;
          teks += `*• /perusahaanku [kode] - Lihat detail perusahaan Anda*\n`;
          teks += `*• /upgradeperusahaan [kode] - Naikkan level perusahaan*\n`;
          teks += `*• /jualperusahaan [kode] [harga] - Jual perusahaan ke user lain*\n`;
          teks += `*• /produksi [kode] - Produksi barang (manual)*\n`;
          teks += `*• /jualproduk [kode] [jumlah] - Jual produk ke pasar*\n`;
          teks += `*• /belibahan [kode] [jumlah] - Beli bahan baku*\n`;
          teks += `*• /depositperusahaan [kode] - Deposit modal perusahaan*\n`;
          teks += `*• /selesaikanproblem [kode] - Selesaikan masalah perusahaan*\n\n`;

          teks += `*📊 SAHAM PERUSAHAAN:*\n`;
          teks += `*┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n`;
          teks += `*• /daftarbursa [kode] [harga] [nama] - Daftarkan saham ke bursa (Rp500.000)*\n`;
          teks += `*• /listsaham - Lihat semua saham (termasuk perusahaan user)*\n`;
          teks += `*• /belisaham [kode] [lot] - Beli saham perusahaan*\n`;
          teks += `*• /ceksaham [kode] - Cek portfolio saham*\n`;
          teks += `*• /topsaham - Top 10 investor saham*\n\n`;

          teks += `*💡 TIPE PERUSAHAAN:*\n`;
          teks += `*┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n`;
          teks += `*• makanan - Produksi makanan/minuman (profit sedang)*\n`;
          teks += `*• barang - Produksi barang fisik (profit tinggi)*\n`;
          teks += `*• bank - Perusahaan perbankan (bisa terima deposit)*\n\n`;

          teks += `*⚠️ PERINGATAN:*\n`;
          teks += `*• Setiap 2-6 jam bisa muncul MASALAH RANDOM*\n`;
          teks += `*• Jika tidak diselesaikan, harga saham turun drastis*\n`;
          teks += `*• Semakin tinggi level, semakin besar produksi*\n\n`;

          teks += `*📌 /bank - Untuk menu perbankan (khusus type bank)*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("COMPANY MENU ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan menu!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "bank":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let teks = `*🏦 SISTEM PERBANKAN* 🏦\n\n`;
          teks += `*📌 UNTUK NASABAH (SEMUA USER):*\n`;
          teks += `*┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n`;
          teks += `*• /banklist - Lihat semua bank yang tersedia*\n`;
          teks += `*• /bankinfo [kode] - Lihat detail bank*\n`;
          teks += `*• /bankdeposit [kode] [jumlah] - Deposit uang ke bank*\n`;
          teks += `*• /bankwithdraw [kode] [jumlah/all] - Tarik uang dari bank*\n\n`;

          teks += `*📌 UNTUK OWNER BANK (PEMILIK BANK):*\n`;
          teks += `*┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n`;
          teks += `*• /bankbunga [kode] [persen] - Atur bunga bank (0.1% - 2%)*\n`;
          teks += `*• /bankpinjam [kode] [username] [jumlah] - Pinjaman ke nasabah*\n`;
          teks += `*• /banktarikpinjam [kode] [username] - Tarik pinjaman nasabah*\n`;
          teks += `*• /bankstatistik [kode] - Lihat statistik bank*\n\n`;

          teks += `*💡 KEUNTUNGAN NABUNG DI BANK:*\n`;
          teks += `*┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n`;
          teks += `*• Bunga ${globalSaham.settings?.bankInterest || 0.5}% per hari*\n`;
          teks += `*• Aman dari pencurian*\n`;
          teks += `*• Deposit dijamin (selama bank tidak bangkrut)*\n`;
          teks += `*• Bisa withdraw kapan saja (ada admin fee 0.5%)*\n\n`;

          teks += `*⚠️ PERINGATAN:*\n`;
          teks += `*┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈*\n`;
          teks += `*• Bank bisa BANGKRUT jika kelola uangnya jelek*\n`;
          teks += `*• Harga saham bank mempengaruhi kepercayaan nasabah*\n`;
          teks += `*• Pilih bank dengan bunga tinggi tapi tetap aman*\n\n`;

          teks += `*📌 /company - Menu game perusahaan*\n`;
          teks += `*📌 /buatperusahaan - Dirikan bank sendiri!*`;

          await socket.sendMessage(idChat, {
            text: teks
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BANK MENU ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menampilkan menu!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "selesaikanproblem":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ /selesaikanproblem [kode perusahaan]*\n*📌 Contoh: /selesaikanproblem MAJU*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let company = globalSaham.companyStocks[companyCode];

          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!company.companyData.problem) {
            await socket.sendMessage(idChat, {
              text: "*✅ Tidak ada masalah sedang berlangsung!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let problem = company.companyData.problem;
          let userSaldo = globalSaldo[username] || 0;

          if (userSaldo < problem.cost) {
            await socket.sendMessage(idChat, {
              text: `*❌ SALDO TIDAK CUKUP!*\n\n*💰 Biaya solusi : Rp${problem.cost.toLocaleString()}*\n*💳 Saldo Anda : Rp${userSaldo.toLocaleString()}*\n*💸 Kekurangan : Rp${(problem.cost - userSaldo).toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Bayar biaya solusi
          globalSaldo[username] -= problem.cost;

          // Kembalikan harga saham ke sebelum problem
          let stock = globalSaham.stocks[companyCode];
          if (stock) {
            let oldPrice = stock.currentPrice;
            stock.currentPrice = Math.floor(stock.currentPrice / problem.effect);

            // Bonus harga +5% karena berhasil solve
            stock.currentPrice = Math.floor(stock.currentPrice * 1.05);
          }

          // Catat ke history
          company.companyData.history = company.companyData.history || [];
          company.companyData.history.unshift({
            time: Date.now(),
            type: "PROBLEM_SOLVED",
            name: problem.name,
            cost: problem.cost,
            newPrice: stock?.currentPrice
          });

          // Hapus problem
          company.companyData.problem = null;

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          let bonusText = stock ? `\n*📈 Harga saham naik +5% karena berhasil mengatasi masalah!*`: "";

          await socket.sendMessage(idChat, {
            text: `*✅ MASALAH SELESAI!* ✅\n\n*🏢 Perusahaan : ${company.name} (${companyCode})*\n*🔴 ${problem.name}*\n*💰 Biaya solusi : -Rp${problem.cost.toLocaleString()}*\n*💳 Sisa saldo: Rp${(globalSaldo[username] || 0).toLocaleString()}*${bonusText}\n\n*📌 Perusahaan kembali berjalan normal!*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("SELESAIKANPROBLEM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menyelesaikan masalah!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "upgradeperusahaan":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ /upgradeperusahaan [kode]\n*📌 Contoh: /upgradeperusahaan KLX*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let company = globalSaham.companyStocks[companyCode];

          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan dengan kode "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyData = company.companyData;
          let currentLevel = companyData.level || 1;
          let upgradeCost = 5000000 * Math.pow(2, currentLevel - 1);

          if (companyData.cash < upgradeCost) {
            await socket.sendMessage(idChat, {
              text: `*❌ KAS PERUSAHAAN TIDAK CUKUP!*\n\n*💰 Kas perusahaan : Rp${companyData.cash.toLocaleString()}*\n*📊 Biaya upgrade level ${currentLevel + 1}: Rp${upgradeCost.toLocaleString()}*\n*💸 Kekurangan : Rp${(upgradeCost - companyData.cash).toLocaleString()}*\n\n*📌 /depositperusahaan ${companyCode} [jumlah] - Tambah modal*`
            }, {
              quoted: pesan
            });
            break;
          }

          companyData.cash -= upgradeCost;
          companyData.level = currentLevel + 1;
          companyData.production = 10 * companyData.level;

          let stock = globalSaham.stocks[companyCode];

          companyData.history = companyData.history || [];
          companyData.history.unshift({
            time: Date.now(),
            type: "UPGRADE",
            levelLama: currentLevel,
            levelBaru: companyData.level,
            biaya: upgradeCost
          });

          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*⬆️ PERUSAHAAN BERHASIL DIUPGRADE!* ⬆️\n\n*🏢 Perusahaan: ${company.name} (${companyCode})*\n*📊 Level: ${currentLevel} → ${companyData.level}*\n*💰 Biaya: -Rp${upgradeCost.toLocaleString()}*\n*⚡ Produksi per jam: ${10 * currentLevel} → ${10 * companyData.level} produk*\n*💰 Kas perusahaan : Rp${companyData.cash.toLocaleString()}*\n\n*📌 Level ${companyData.level} unlocked! Produksi lebih cepat!*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("UPGRADEPERUSAHAAN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal upgrade!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "jualproduk":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ /jualproduk [kode] [jumlah/all]\n*📌 Contoh: /jualproduk KLX 50\n*📌 Contoh: /jualproduk KLX all*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let company = globalSaham.companyStocks[companyCode];

          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan dengan kode "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyData = company.companyData;
          let inventory = companyData.inventory || 0;

          if (inventory === 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Tidak ada produk yang tersedia!*\n*📌 /produksi ${companyCode} - Produksi barang dulu*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[1]) {
            await socket.sendMessage(idChat, {
              text: `*📊 STOK PRODUK ${company.name}*\n\n*📦 Stok tersedia: ${inventory} produk*\n*💰 Harga jual: ${company.sector === "makanan" ? "Rp5.000": "Rp10.000"}/produk*\n\n*📌 /jualproduk ${companyCode} [jumlah/all] - Jual produk*`
            }, {
              quoted: pesan
            });
            break;
          }

          let jualAmount = args[1].toLowerCase() === "all" ? inventory: parseInt(args[1]);

          if (isNaN(jualAmount) || jualAmount <= 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Jumlah tidak valid!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (jualAmount > inventory) {
            await socket.sendMessage(idChat, {
              text: `*❌ Stok tidak cukup! Tersisa ${inventory} produk*`
            }, {
              quoted: pesan
            });
            break;
          }

          let hargaJual = company.sector === "makanan" ? 5000: (company.sector === "barang" ? 10000: 0);

          if (hargaJual === 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Perusahaan bank tidak bisa menjual produk!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let pendapatan = jualAmount * hargaJual;

          companyData.inventory -= jualAmount;
          companyData.cash += pendapatan;

          companyData.history = companyData.history || [];
          companyData.history.unshift({
            time: Date.now(),
            type: "JUAL",
            jumlah: jualAmount,
            harga: hargaJual,
            total: pendapatan
          });

          let stock = globalSaham.stocks[companyCode];
          let increase = 0;
          if (stock) {
            increase = Math.min(jualAmount / 100, 5);
            stock.currentPrice = Math.floor(stock.currentPrice * (1 + increase / 100));
          }

          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*💰 PENJUALAN PRODUK BERHASIL!* 💰\n\n*🏢 Perusahaan: ${company.name} (${companyCode})*\n*📦 Terjual: ${jualAmount} produk*\n*💰 Harga jual: Rp${hargaJual.toLocaleString()}/produk*\n*💎 Total pendapatan: +Rp${pendapatan.toLocaleString()}*\n*📦 Sisa stok: ${companyData.inventory} produk*\n*💰 Kas perusahaan: Rp${companyData.cash.toLocaleString()}*\n*📈 Harga saham naik ${increase.toFixed(1)}%*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("JUALPRODUK ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menjual produk!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "produksi":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: "*❌ /produksi [kode]\n*📌 Contoh: /produksi KLX*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let company = globalSaham.companyStocks[companyCode];

          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan dengan kode "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.sector === "Perbankan") {
            await socket.sendMessage(idChat, {
              text: "*❌ Bank tidak bisa produksi!*\n*📌 Bank menghasilkan uang dari bunga pinjaman*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyData = company.companyData;
          let bahanBaku = companyData.bahanBaku || 0;
          let level = companyData.level || 1;
          let konversi = 10 * level;

          if (bahanBaku < konversi) {
            await socket.sendMessage(idChat, {
              text: `*❌ BAHAN BAKU TIDAK CUKUP!*\n\n*📦 Bahan tersedia: ${bahanBaku} unit*\n*📊 Dibutuhkan: ${konversi} unit*\n*📌 /belibahan ${companyCode} [jumlah] - Beli bahan baku*`
            }, {
              quoted: pesan
            });
            break;
          }

          companyData.bahanBaku -= konversi;
          companyData.inventory = (companyData.inventory || 0) + konversi;

          companyData.history = companyData.history || [];
          companyData.history.unshift({
            time: Date.now(),
            type: "PRODUKSI",
            bahanTerpakai: konversi,
            produkDihasilkan: konversi,
            level: level
          });

          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*🏭 PRODUKSI BERHASIL!* 🏭\n\n*🏢 Perusahaan: ${company.name} (${companyCode})*\n*⚙️ Level: ${level}*\n*📦 Bahan terpakai: ${konversi} unit*\n*📦 Produk dihasilkan: +${konversi} unit*\n*📦 Total stok produk: ${companyData.inventory} unit*\n*📦 Sisa bahan: ${companyData.bahanBaku} unit*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("PRODUKSI ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal produksi!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "belibahan":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ /belibahan [kode] [jumlah]\n*📌 Contoh: /belibahan KLX 100\n*📌 Harga bahan baku: Rp2.000/bahan*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let amount = parseInt(args[1]);

          let company = globalSaham.companyStocks[companyCode];

          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan dengan kode "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.sector === "Perbankan") {
            await socket.sendMessage(idChat, {
              text: "*❌ Perusahaan bank tidak perlu bahan baku!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (amount <= 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Jumlah tidak valid!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyData = company.companyData;
          let hargaBahan = 2000;
          let totalBiaya = amount * hargaBahan;

          if (companyData.cash < totalBiaya) {
            await socket.sendMessage(idChat, {
              text: `*❌ KAS PERUSAHAAN TIDAK CUKUP!*\n\n*💰 Kas perusahaan: Rp${companyData.cash.toLocaleString()}*\n*📊 Biaya bahan: Rp${totalBiaya.toLocaleString()}*\n*💸 Kekurangan: Rp${(totalBiaya - companyData.cash).toLocaleString()}*\n\n*📌 /depositperusahaan ${companyCode} [jumlah] - Tambah modal*`
            }, {
              quoted: pesan
            });
            break;
          }

          companyData.cash -= totalBiaya;
          companyData.bahanBaku = (companyData.bahanBaku || 0) + amount;

          companyData.history = companyData.history || [];
          companyData.history.unshift({
            time: Date.now(),
            type: "BELI_BAHAN",
            jumlah: amount,
            harga: hargaBahan,
            total: totalBiaya
          });

          let stock = globalSaham.stocks[companyCode];
          let decrease = 0;
          if (stock) {
            decrease = Math.min(amount / 500, 3);
            stock.currentPrice = Math.floor(stock.currentPrice * (1 - decrease / 100));
          }

          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*📦 PEMBELIAN BAHAN BAKU BERHASIL!* 📦\n\n*🏢 Perusahaan: ${company.name} (${companyCode})*\n*📦 Bahan dibeli: ${amount} unit*\n*💰 Harga: Rp${hargaBahan.toLocaleString()}/unit*\n*💎 Total biaya: -Rp${totalBiaya.toLocaleString()}*\n*📦 Total bahan: ${companyData.bahanBaku} unit*\n*💰 Kas perusahaan: Rp${companyData.cash.toLocaleString()}*\n*📉 Harga saham turun ${decrease.toFixed(1)}%*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("BELIBAHAN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal beli bahan!*"
          }, {
            quoted: pesan
          });
        }
        break;

      case "produksi":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          // Cari semua perusahaan milik user (non-bank)
          let userCompanies = [];
          for (let [kode, company] of Object.entries(globalSaham.companyStocks)) {
            if (company.owner === username && company.sector !== "bank") {
              userCompanies.push({
                kode, ...company
              });
            }
          }

          if (userCompanies.length === 0) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda tidak memiliki perusahaan (non-bank)!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let selectedCompany = null;
          let companyCode = null;

          if (userCompanies.length === 1) {
            selectedCompany = userCompanies[0];
            companyCode = selectedCompany.kode;
          } else {
            let listText = "*📋 Pilih perusahaan:*\n\n";
            for (let i = 0; i < userCompanies.length; i++) {
              listText += `${i + 1}. ${userCompanies[i].name} (${userCompanies[i].kode}) - ${userCompanies[i].sector}\n`;
            }
            listText += `\n*📌 /produksi [nomor]*\n*📌 Contoh : /produksi 1*`;
            await socket.sendMessage(idChat, {
              text: listText
            }, {
              quoted: pesan
            });
            break;
          }

          let companyData = selectedCompany.companyData;
          let bahanBaku = companyData.bahanBaku || 0;
          let level = companyData.level || 1;
          let konversi = 10 * level;

          if (bahanBaku < konversi) {
            await socket.sendMessage(idChat, {
              text: `*❌ BAHAN BAKU TIDAK CUKUP!*\n\n*📦 Bahan tersedia: ${bahanBaku} unit*\n*📊 Dibutuhkan: ${konversi} unit*\n*📌 /belibahan [jumlah] - Beli bahan baku*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Proses produksi
          companyData.bahanBaku -= konversi;
          companyData.inventory = (companyData.inventory || 0) + konversi;

          // Catat history
          companyData.history = companyData.history || [];
          companyData.history.unshift({
            time: Date.now(),
            type: "PRODUKSI",
            bahanTerpakai: konversi,
            produkDihasilkan: konversi,
            level: level
          });

          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*🏭 PRODUKSI BERHASIL!* 🏭\n\n*🏢 Perusahaan: ${selectedCompany.name} (${companyCode})*\n*⚙️ Level: ${level}*\n*📦 Bahan terpakai: ${konversi} unit*\n*📦 Produk dihasilkan: +${konversi} unit*\n*📦 Total stok produk: ${companyData.inventory} unit*\n*📦 Sisa bahan: ${companyData.bahanBaku} unit*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("PRODUKSI ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal produksi!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "depositperusahaan":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ /depositperusahaan [kode] [jumlah]*\n*📌 Contoh: /depositperusahaan KLX 1000000*\n*📌 Minimal deposit Rp100.000*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let amount = parseInt(args[1]);

          if (amount < 100000) {
            await socket.sendMessage(idChat, {
              text: "*❌ Minimal deposit Rp100.000!*"
            }, {
              quoted: pesan
            });
            break;
          }

          // Cek perusahaan
          let company = globalSaham.companyStocks[companyCode];
          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan dengan kode "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let userSaldo = globalSaldo[username] || 0;
          if (userSaldo < amount) {
            await socket.sendMessage(idChat, {
              text: `*❌ Saldo tidak cukup! Butuh Rp${amount.toLocaleString()}*`
            }, {
              quoted: pesan
            });
            break;
          }

          // Transfer saldo
          globalSaldo[username] -= amount;
          company.companyData.cash += amount;

          saveDB("./lib/database/globalSaldo.json", globalSaldo);
          saveDB("./lib/database/globalSaham.json", globalSaham);

          await socket.sendMessage(idChat, {
            text: `*💰 DEPOSIT KE PERUSAHAAN BERHASIL!* 💰\n\n*🏢 Perusahaan : ${company.name} (${companyCode})*\n*💰 Jumlah : +Rp${amount.toLocaleString()}*\n*💳 Saldo pribadi : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n*💰 Kas perusahaan : Rp${company.companyData.cash.toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("DEPOSITPERUSAHAAN ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal deposit!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "tambahsaham":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0] || !args[1] || isNaN(args[1])) {
            await socket.sendMessage(idChat, {
              text: "*❌ /tambahsaham [kode] [lembar]\n*📌 Contoh : /tambahsaham KLX 500\n*💰 Biaya : Rp10.000 per lembar saham baru*\n*⚠️ Hanya pemilik perusahaan yang bisa*"
            }, {
              quoted: pesan
            });
            break;
          }

          let companyCode = args[0].toUpperCase();
          let newShares = parseInt(args[1]);

          if (newShares < 100) {
            await socket.sendMessage(idChat, {
              text: "*❌ Minimal tambah 100 lembar saham!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (newShares > 10000) {
            await socket.sendMessage(idChat, {
              text: "*❌ Maksimal tambah 10.000 lembar per transaksi!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let company = globalSaham.companyStocks[companyCode];
          if (!company) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan dengan kode "${companyCode}" tidak ditemukan!*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (company.owner !== username) {
            await socket.sendMessage(idChat, {
              text: "*❌ Anda bukan pemilik perusahaan ini!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let stock = globalSaham.stocks[companyCode];
          if (!stock) {
            await socket.sendMessage(idChat, {
              text: `*❌ Perusahaan "${companyCode}" belum terdaftar di bursa!*\n*📌 /daftarbursa ${companyCode} [harga] [nama]*`
            }, {
              quoted: pesan
            });
            break;
          }

          let hargaPerLembar = stock.currentPrice;
          let biayaTotal = newShares * hargaPerLembar;
          let biayaCorporate = newShares * 10000;

          if (company.companyData.cash < biayaTotal) {
            await socket.sendMessage(idChat, {
              text: `*❌ KAS PERUSAHAAN TIDAK CUKUP!*\n\n*💰 Kas perusahaan : Rp${company.companyData.cash.toLocaleString()}*\n*📊 Biaya cetak saham : Rp${biayaTotal.toLocaleString()}*\n*💸 Kekurangan : Rp${(biayaTotal - company.companyData.cash).toLocaleString()}*\n\n*📌 /depositperusahaan ${companyCode} [jumlah] - Tambah modal*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[2] || args[2].toLowerCase() !== "confirm") {
            await socket.sendMessage(idChat, {
              text: `*⚠️ KONFIRMASI TAMBAH SAHAM* ⚠️\n\n*🏢 Perusahaan : ${company.name} (${companyCode})*\n*📊 Saham saat ini : ${stock.volume} lembar*\n*➕ Saham baru : +${newShares} lembar*\n*📈 Total setelah : ${stock.volume + newShares} lembar*\n*💰 Biaya cetak saham : Rp${biayaTotal.toLocaleString()}*\n*📋 Biaya administrasi : Rp${biayaCorporate.toLocaleString()}*\n*💎 Total biaya : Rp${(biayaTotal + biayaCorporate).toLocaleString()}*\n\n*⚠️ Harga saham akan turun karena dilusi!*\n*📌 Ketik: /tambahsaham ${companyCode} ${newShares} confirm*`
            }, {
              quoted: pesan
            });
            break;
          }

          let totalBiaya = biayaTotal + biayaCorporate;
          company.companyData.cash -= totalBiaya;

          let oldVolume = stock.volume;
          let oldPrice = stock.currentPrice;

          stock.volume += newShares;
          company.volume = stock.volume;

          // Hitung harga baru setelah dilusi
          let newPrice = Math.floor((oldPrice * oldVolume) / stock.volume);
          stock.currentPrice = newPrice;
          company.currentPrice = newPrice;

          // Owner dapat 60% dari saham baru
          let ownerShares = Math.floor(newShares * 60 / 100);
          let publicShares = newShares - ownerShares;

          if (!company.shareholders) company.shareholders = {};
          company.shareholders[username] = (company.shareholders[username] || 0) + ownerShares;

          if (!globalSaham.users[username]) {
            globalSaham.users[username] = {
              portfolio: {},
              totalInvest: 0,
              history: []
            };
          }
          if (!globalSaham.users[username].portfolio[companyCode]) {
            globalSaham.users[username].portfolio[companyCode] = {
              lot: 0,
              saham: 0,
              avgPrice: 0,
              totalInvest: 0
            };
          }

          let userStock = globalSaham.users[username].portfolio[companyCode];
          userStock.saham += ownerShares;
          userStock.lot = userStock.saham / 100;
          userStock.totalInvest += ownerShares * oldPrice;
          userStock.avgPrice = userStock.saham > 0 ? userStock.totalInvest / userStock.saham: 0;

          if (stock.type === "company") {
            stock.availableShares = (stock.availableShares || 0) + publicShares;
          }

          company.companyData.history = company.companyData.history || [];
          company.companyData.history.unshift({
            time: Date.now(),
            type: "RIGHT_ISSUE",
            newShares: newShares,
            ownerShares: ownerShares,
            publicShares: publicShares,
            oldPrice: oldPrice,
            newPrice: newPrice,
            cost: totalBiaya
          });

          saveDB("./lib/database/globalSaham.json", globalSaham);

          let totalSahamOwner = userStock.saham;
          let totalLotOwner = userStock.lot;

          await socket.sendMessage(idChat, {
            text: `*✅ TAMBAH SAHAM BERHASIL!* ✅\n\n*🏢 Perusahaan : ${company.name} (${companyCode})*\n*📊 Saham lama : ${oldVolume.toLocaleString()} lembar*\n*➕ Saham baru : +${newShares.toLocaleString()} lembar*\n*📈 Total saham : ${stock.volume.toLocaleString()} lembar*\n*💰 Biaya total : -Rp${totalBiaya.toLocaleString()}*\n*👤 Anda dapat : +${ownerShares.toLocaleString()} lembar (60%)*\n*📊 Total saham Anda : ${totalSahamOwner.toLocaleString()} lembar (${totalLotOwner} lot)*\n*📊 Untuk publik : +${publicShares.toLocaleString()} lembar (40%)*\n*📉 Harga saham : Rp${oldPrice.toLocaleString()} → Rp${newPrice.toLocaleString()} (turun ${Math.round((1 - newPrice/oldPrice) * 100)}%)*\n*💰 Kas perusahaan : Rp${company.companyData.cash.toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("TAMBAHSAHAM ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal tambah saham!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "jual":
        try {
          if (!users[pengirim]) {
            await socket.sendMessage(idChat, {
              text: "*❌ Login dulu dengan /login!*"
            }, {
              quoted: pesan
            });
            break;
          }

          let username = users[pengirim].username;

          if (!args[0]) {
            await socket.sendMessage(idChat, {
              text: `*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh:  /jual BTC 0.001*\n*📌 Contoh: /jual EMAS 5*\n*📌 Contoh : /jual ETH 0.5*\n*📌 Contoh: /jual BTC all*`
            }, {
              quoted: pesan
            });
            break;
          }

          let aset = args[0].toUpperCase();

          let assetData = null;
          let userAsset = null;
          let jumlahSekarang = 0;
          let icon = "";
          let name = "";
          let tax = 0.02;

          if (aset === "EMAS") {
            assetData = {
              currentPrice: hargaEmas,
              tax: 0.02
            };
            userAsset = globalEmas[username];
            jumlahSekarang = userAsset?.gram || 0;
            icon = "🪙";
            name = "Emas";
            tax = 0.02;
          } else if (aset === "BTC") {
            assetData = {
              currentPrice: hargaBitcoin,
              tax: 0.02
            };
            userAsset = globalBtc[username];
            jumlahSekarang = userAsset?.jumlah || 0;
            icon = "₿";
            name = "Bitcoin";
            tax = 0.02;
          } else {
            assetData = cryptoData.assets[aset];
            if (!assetData) {
              await socket.sendMessage(idChat, {
                text: `*❌ Aset "${aset}" tidak ditemukan!*`
              }, {
                quoted: pesan
              });
              break;
            }
            userAsset = cryptoUserData.users[username]?.[aset];
            jumlahSekarang = userAsset?.jumlah || 0;
            icon = assetData.icon;
            name = assetData.name;
            tax = assetData.tax || 0.02;
          }

          if (jumlahSekarang === 0) {
            await socket.sendMessage(idChat, {
              text: `*❌ ANDA TIDAK MEMILIKI ${name}!*\n\n*📌 Gunakan /beli ${aset} untuk membeli terlebih dahulu*`
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[1]) {
            await socket.sendMessage(idChat, {
              text: `*❌ PENGGUNAAN SALAH!*\n\n*📌 Contoh : /jual ${aset} 0.001*\n*📌 Contoh: /jual ${aset} all*\n*💰 Harga saat ini : Rp${assetData.currentPrice.toLocaleString()}\n*${icon} ${aset} Anda : ${jumlahSekarang} ${aset}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let jumlahJual = 0;

          if (args[1].toLowerCase() === "all") {
            jumlahJual = jumlahSekarang;
          } else {
            jumlahJual = parseFloat(args[1]);
            if (isNaN(jumlahJual) || jumlahJual <= 0) {
              await socket.sendMessage(idChat, {
                text: "*❌ Masukkan jumlah yang valid!*"
              }, {
                quoted: pesan
              });
              break;
            }
            jumlahJual = Math.floor(jumlahJual * 10000000) / 10000000;
          }

          if (jumlahJual > jumlahSekarang) {
            await socket.sendMessage(idChat, {
              text: `*❌ ${aset} tidak cukup! ${icon} Anda : ${jumlahSekarang} ${aset}*`
            }, {
              quoted: pesan
            });
            break;
          }

          let nilaiKotor = jumlahJual * assetData.currentPrice;
          let pajakAmount = Math.floor(nilaiKotor * tax);
          let nilaiBersih = nilaiKotor - pajakAmount;

          globalSaldo[username] = (globalSaldo[username] || 0) + nilaiBersih;

          globalSaldo[ownerLid] = (globalSaldo[ownerLid] || 0) + pajakAmount;

          if (aset === "EMAS") {
            globalEmas[username].gram -= jumlahJual;
            let proporsi = jumlahJual / (globalEmas[username].gram + jumlahJual);
            globalEmas[username].totalInvest = Math.floor(globalEmas[username].totalInvest * (1 - proporsi));
            globalEmas[username].history.unshift({
              type: "JUAL", gram: jumlahJual, price: assetData.currentPrice,
              gross: nilaiKotor, tax: pajakAmount, net: nilaiBersih, time: Date.now()
            });
            saveDB("./lib/database/emas.json", globalEmas);
          } else if (aset === "BTC") {
            globalBtc[username].jumlah -= jumlahJual;
            let proporsi = jumlahJual / (globalBtc[username].jumlah + jumlahJual);
            globalBtc[username].totalInvest = Math.floor(globalBtc[username].totalInvest * (1 - proporsi));
            globalBtc[username].history.unshift({
              type: "JUAL", btc: jumlahJual, price: assetData.currentPrice,
              gross: nilaiKotor, tax: pajakAmount, net: nilaiBersih, time: Date.now()
            });
            saveDB("./lib/database/btc.json", globalBtc);
            jumlahBtc.totalStock += jumlahJual;
            saveDB("./lib/database/globalBtc.json", jumlahBtc);
          } else {
            cryptoUserData.users[username][aset].jumlah -= jumlahJual;
            let proporsi = jumlahJual / (cryptoUserData.users[username][aset].jumlah + jumlahJual);
            cryptoUserData.users[username][aset].totalInvest = Math.floor(cryptoUserData.users[username][aset].totalInvest * (1 - proporsi));
            cryptoUserData.users[username][aset].history.unshift({
              type: "JUAL", amount: jumlahJual, price: assetData.currentPrice,
              gross: nilaiKotor, tax: pajakAmount, net: nilaiBersih, time: Date.now()
            });
            saveDB("./lib/database/cryptoUserData.json", cryptoUserData);
          }

          saveDB("./lib/database/globalSaldo.json", globalSaldo);

          let sisaJumlah = jumlahSekarang - jumlahJual;
          let keuntungan = nilaiBersih - (jumlahJual * ((userAsset?.totalInvest || 0) / (sisaJumlah + jumlahJual) || 0));

          await socket.sendMessage(idChat, {
            text: `*✅ PENJUALAN ${name} BERHASIL!*\n\n*${icon} ${aset} dijual : ${jumlahJual} ${aset}*\n*💰 Harga jual : Rp${assetData.currentPrice.toLocaleString()}*\n*💵 Nilai kotor : Rp${Math.floor(nilaiKotor).toLocaleString()}*\n*📉 Pajak (${tax * 100}%) : Rp${pajakAmount.toLocaleString()}*\n*💳 Nilai bersih : Rp${Math.floor(nilaiBersih).toLocaleString()}*\n*📈 Keuntungan : ${keuntungan >= 0 ? "+": ""}Rp${Math.floor(keuntungan).toLocaleString()}*\n*💳 Saldo baru : Rp${(globalSaldo[username] || 0).toLocaleString()}*\n*${icon} Sisa ${aset} : ${sisaJumlah.toLocaleString()} ${aset}*\n\n*📌 Harga ${aset} saat ini : Rp${assetData.currentPrice.toLocaleString()}*`
          }, {
            quoted: pesan
          });

        } catch (err) {
          console.log("JUAL ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal menjual!*"
          }, {
            quoted: pesan
          });
        }
        break;
      case "kebijakan":
        try {
          await socket.sendMessage(idChat, {
            text: `*⚠️ Kebijakan KaelBot ⚠️*\n\n𝗗𝗶𝗹𝗮𝗿𝗮𝗻𝗴 𝗸𝗲𝗿𝗮𝘀 𝘀𝗽𝗮𝗺 𝗰𝗼𝗺𝗺𝗮𝗻𝗱 𝗯𝗼𝘁, 𝗺𝗲𝗻𝗴𝗲𝗸𝘀𝗽𝗹𝗼𝗶𝘁𝗮𝘀𝗶 𝗮𝘁𝗮𝘂 𝗺𝗲𝗺𝗮𝗻𝗳𝗮𝗮𝘁𝗸𝗮𝗻 𝗸𝗲𝗹𝗲𝗺𝗮𝗵𝗮𝗻 𝘀𝗶𝘀𝘁𝗲𝗺/𝗳𝗶𝘁𝘂𝗿, 𝘀𝗲𝗿𝘁𝗮 𝗺𝗲𝗹𝗮𝗸𝘂𝗸𝗮𝗻 𝗰𝗮𝗿𝗮 𝗰𝘂𝗿𝗮𝗻𝗴 𝘆𝗮𝗻𝗴 𝘁𝗶𝗱𝗮𝗸 𝗷𝘂𝗷𝘂𝗿 𝘀𝗲𝗽𝗲𝗿𝘁𝗶 𝗺𝗲𝗺𝗮𝗻𝗶𝗽𝘂𝗹𝗮𝘀𝗶, 𝗺𝗲𝗺𝗯𝘂𝗮𝘁 𝗮𝗸𝘂𝗻 𝗹𝗲𝗯𝗶𝗵 𝗱𝗮𝗿𝗶 𝘀𝗮𝘁𝘂 𝘂𝗻𝘁𝘂𝗸 𝘁𝘂𝗷𝘂𝗮𝗻 𝗺𝗲𝗻𝗮𝗺𝗯𝗮𝗵𝗸𝗮𝗻 𝘀𝗮𝗹𝗱𝗼. 𝗦𝗲𝘁𝗶𝗮𝗽 𝗽𝗲𝗹𝗮𝗻𝗴𝗴𝗮𝗿𝗮𝗻 𝘁𝗲𝗿𝗵𝗮𝗱𝗮𝗽 𝗮𝘁𝘂𝗿𝗮𝗻 𝘁𝗲𝗿𝘀𝗲𝗯𝘂𝘁 𝗮𝗸𝗮𝗻 𝗯𝗲𝗿𝗮𝗸𝗶𝗯𝗮𝘁 𝗹𝗮𝗻𝗴𝘀𝘂𝗻𝗴 𝗽𝗮𝗱𝗮 𝗽𝗲𝗺𝗯𝗹𝗼𝗸𝗶𝗿𝗮𝗻 𝗮𝗸𝘂𝗻 𝘀𝗲𝗰𝗮𝗿𝗮 𝗽𝗲𝗿𝗺𝗮𝗻𝗲𝗻 𝘁𝗮𝗻𝗽𝗮 𝗽𝗲𝗺𝗯𝗲𝗿𝗶𝘁𝗮𝗵𝘂𝗮𝗻 𝘀𝗲𝗯𝗲𝗹𝘂𝗺𝗻𝘆𝗮.`
          }, {
            quoted: pesan
          })
        } catch (err) {
          console.log("Kebijakan Error :", err)
        }
        break
      case "nobot":
        try {
          if (!dariGrup) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command ini hanya bisa digunakan di grup!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!pengirimAdmin) {
            await socket.sendMessage(idChat, {
              text: "*❌ Command khusus admin grup!*"
            }, {
              quoted: pesan
            });
            break;
          }

          if (!args[0]) {
            let status = isNobotActive(idChat) ? "🟢 AKTIF": "🔴 NONAKTIF";
            let bannedList = Object.values(nobotData.bannedUsers);

            await socket.sendMessage(idChat, {
              text: `*🤖 NOBOT MODE* 🤖\n\n*Status : ${status}*\n\n*📌 /nobot on - Aktifkan (user kena ban global jika pakai command)*\n*📌 /nobot off - Nonaktifkan*`
            }, {
              quoted: pesan
            });
            break;
          }

          let action = args[0].toLowerCase();

          if (action === "on") {
            if (isNobotActive(idChat)) {
              await socket.sendMessage(idChat, {
                text: "*⚠️ NOBOT mode sudah aktif!*"
              }, {
                quoted: pesan
              });
              break;
            }

            nobotData.activeGroups[idChat] = true;
            saveDB("./lib/database/nobot.json", nobotData);

            await socket.sendMessage(idChat, {
              text: `*🤖 NOBOT MODE DIAKTIFKAN!* 🤖\n\n*⚠️ Semua member yang menggunakan command fitur bot akan di-BAN GLOBAL!*`
            }, {
              quoted: pesan
            });

          } else if (action === "off") {
            if (!isNobotActive(idChat)) {
              await socket.sendMessage(idChat, {
                text: "*⚠️ NOBOT mode sedang tidak aktif!*"
              }, {
                quoted: pesan
              });
              break;
            }

            nobotData.activeGroups[idChat] = false;
            saveDB("./lib/database/nobot.json", nobotData);

            await socket.sendMessage(idChat, {
              text: "*🤖 NOBOT MODE DINONAKTIFKAN!*\n\n*✅ Member sudah bisa menggunakan bot kembali.*"
            }, {
              quoted: pesan
            });
          }

        } catch (err) {
          console.log("NOBOT ERROR:", err);
          await socket.sendMessage(idChat, {
            text: "*❌ Gagal!*"
          }, {
            quoted: pesan
          });
        }
        break;
      }
    })

    // ===================== WELCOME & GOODBYE =====================
    socket.ev.on("group-participants.update",
      async (data) => {
        try {

          const idGrup = data.id
          const metadata = await socket.groupMetadata(idGrup)
          const userJid = data.participants[0]
          const nomor = userJid.split("@")[0]
          const namaGrup = metadata.subject || "Grup WhatsApp"
          const daftarAdmin = metadata.participants.filter(p => p.admin)
          const adminIds = daftarAdmin.map(p => p.id)
          const botId = socket.user.id.split(":")[0] + "@s.whatsapp.net"
          const botAdmin = adminIds.includes(botId)

          if (data.action === "add") {

            await socket.sendMessage(idGrup, {
              text:
              `*Hai @${nomor}👋, Selamat datang di group ${namaGrup}*\n\n*📌 Jangan lupa baca deskripsi, tetap patuhi aturan dan semoga betah ya!🤗*`,
              mentions: [userJid]
            })
          }

          if (data.action === "remove") {
            await socket.sendMessage(idGrup, {
              text:
              `*Selamat tinggal @${nomor}👋*\n\n*📌 Jangan lupakan kenangan kita bersama ya!* 😢`,
              mentions: [userJid]
            })
          }
        } catch (err) {
          console.log("GROUP PARTICIPANTS ERROR:", err)
        }
      })

    console.log("Bot berjalan")
  }

  startBot()