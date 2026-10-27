PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL, -- PIN 4-6 digit untuk kasir / password untuk owner
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'cashier')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "users" ("id","username","pin","name","role","created_at") VALUES('usr_owner','owner','937377f056160fc4b15e0b770c67136a5f03c15205b4d3bf918268fefa2c6d0a','Owner','owner','2026-10-03 15:11:17');
INSERT INTO "users" ("id","username","pin","name","role","created_at") VALUES('usr_kasir1','kasir','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Kasir Shift Pagi','cashier','2026-10-03 15:11:17');
INSERT INTO "users" ("id","username","pin","name","role","created_at") VALUES('usr_kasir2','kasir_sore','481f6cc0511143ccdd7e2d1b1b94faf0a700a8b49cd13922a70b5ae28acaa8c5','Kasir Shift Sore','cashier','2026-10-03 17:55:28');
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
INSERT INTO "categories" ("id","name","slug","sort_order","is_active") VALUES('cat_kopi','Perkopian','perkopian',1,1);
INSERT INTO "categories" ("id","name","slug","sort_order","is_active") VALUES('cat_minum','Minum-Minum','minum-minum',2,1);
INSERT INTO "categories" ("id","name","slug","sort_order","is_active") VALUES('cat_mie','Permie-an','permie-an',3,1);
INSERT INTO "categories" ("id","name","slug","sort_order","is_active") VALUES('cat_nasi','Pernasi-an','pernasi-an',4,1);
INSERT INTO "categories" ("id","name","slug","sort_order","is_active") VALUES('cat_cemilan','Cemal-Cemil','cemal-cemil',5,1);
INSERT INTO "categories" ("id","name","slug","sort_order","is_active") VALUES('cat_spesial','Spesial','spesial',6,1);
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- dalam Rupiah bulat (misal 15000)
  cost_price INTEGER DEFAULT 0, -- harga modal (untuk hitung laba bersih owner)
  image_url TEXT,
  is_available INTEGER DEFAULT 1,
  is_favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_kopi_1','cat_kopi','Kopi Tubruk',7000,2500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_kopi_2','cat_kopi','Kopi SKM',9000,3500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_kopi_3','cat_kopi','Kopi Jahe',8000,3000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_kopi_4','cat_kopi','Kopi Saset',8000,3000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_kopi_5','cat_kopi','Kopi Susu Sachet',8000,3000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_kopi_6','cat_kopi','Es Kopi Gula Aren',12000,5000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_1','cat_minum','Teh Manis',5000,1500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_2','cat_minum','Teh Tarik',8000,3000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_3','cat_minum','Es Teh Jumbo',7000,2000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_4','cat_minum','Susu',7000,3000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_5','cat_minum','Milo',7000,3000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_6','cat_minum','Susu Jahe',8000,3500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_7','cat_minum','Nutrisari',6000,2500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_8','cat_minum','Good Day Freeze',8000,3500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_9','cat_minum','STMJ',8000,4000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_10','cat_minum','Energen',7000,3000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_11','cat_minum','Xtrejoss Susu',10000,4500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_12','cat_minum','Xtrejoss',6500,2500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_13','cat_minum','Kuku Bima Susu',10000,4500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_14','cat_minum','Kuku Bima',6500,2500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_15','cat_minum','Lemon Tea (Panas/Dingin)',10000,4000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_16','cat_minum','Es Lychee Tea',10000,4000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_minum_17','cat_minum','Soda Gembira',15000,6000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_mie_1','cat_mie','Indomie Polos Single',9000,3500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_mie_2','cat_mie','Indomie Polos Double',12000,6000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_mie_3','cat_mie','Indomie Single Telur',13000,5500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_mie_4','cat_mie','Indomie Telur Double',16000,8000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_mie_5','cat_mie','Intel Kor',17000,8500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_mie_6','cat_mie','Intel Kornas',18000,9500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_mie_7','cat_mie','Mie Tek-Tek',10000,4500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_1','cat_nasi','Nasi Telur',12000,5000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_2','cat_nasi','Nasi Telur Sosis',13000,6000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_3','cat_nasi','Nasi Telur Kornet',15000,7000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_4','cat_nasi','Nasi Kornet',13000,6000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_5','cat_nasi','Nasi Orak Arik Sosis',13000,6000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_6','cat_nasi','Nasi Orak Arik Kornet',16000,7500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_7','cat_nasi','Nasi Orak Arik Omelet',16000,7500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_8','cat_nasi','Nasi Omelet',13000,6000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_9','cat_nasi','Nasi Omelet Sosis',14000,6500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_10','cat_nasi','Nasi Omelet Kornet',17000,8000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_11','cat_nasi','Nasi Gila',15000,7000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_12','cat_nasi','Nasi Goreng Gila',18000,8500,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_13','cat_nasi','Nasi Goreng Sute',15000,7000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_nasi_14','cat_nasi','Nasi Ayam Sambal Matah',16000,8000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_cemil_1','cat_cemilan','Aneka Gorengan',5000,2000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_cemil_2','cat_cemilan','Roti Bakar / Pisang Bakar',12000,5000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_cemil_3','cat_cemilan','Kentang Goreng',9000,4000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_cemil_4','cat_cemilan','Sosis Goreng',9000,4000,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_cemil_5','cat_cemilan','Pancong Lumer',9000,4000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_cemil_6','cat_cemilan','Dimsum',12000,5500,NULL,1,0,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_cemil_7','cat_cemilan','Mix Platter',25000,12000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_spesial_1','cat_spesial','Bubur Kacang Hijau',9000,4000,NULL,1,1,'2026-10-03 15:21:03');
INSERT INTO "products" ("id","category_id","name","price","cost_price","image_url","is_available","is_favorite","created_at") VALUES('prod_spesial_2','cat_spesial','Bubur Ketan Hitam',9000,4000,NULL,1,1,'2026-10-03 15:21:03');
CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  initial_cash INTEGER NOT NULL DEFAULT 0, -- modal kas awal di laci
  total_cash_sales INTEGER DEFAULT 0,
  total_qris_sales INTEGER DEFAULT 0,
  actual_cash_counted INTEGER, -- uang fisik saat tutup shift
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
  notes TEXT,
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);
INSERT INTO "shifts" ("id","cashier_id","start_time","end_time","initial_cash","total_cash_sales","total_qris_sales","actual_cash_counted","status","notes") VALUES('shift_pagi_01','usr_kasir1','2026-10-03 08:00:00','2026-10-03 15:00:00',100000,355000,285000,455000,'closed','Shift pagi tertib, kas klop.');
INSERT INTO "shifts" ("id","cashier_id","start_time","end_time","initial_cash","total_cash_sales","total_qris_sales","actual_cash_counted","status","notes") VALUES('shift_sore_02','usr_kasir1','2026-10-03 15:00:00','2026-10-03 17:45:05',100000,525000,497000,625000,'closed','Shift sore/malam akhir pekan ramai lancar.');
INSERT INTO "shifts" ("id","cashier_id","start_time","end_time","initial_cash","total_cash_sales","total_qris_sales","actual_cash_counted","status","notes") VALUES('shift_1791049527232','usr_kasir1','2026-10-03 17:45:27','2026-10-06 12:00:09',100000,0,0,100000,'closed',NULL);
INSERT INTO "shifts" ("id","cashier_id","start_time","end_time","initial_cash","total_cash_sales","total_qris_sales","actual_cash_counted","status","notes") VALUES('shift_1791508277600','usr_kasir1','2026-10-09 01:11:17',NULL,100000,0,190000,NULL,'open',NULL);
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL, -- e.g. SUTE-261003-0001
  shift_id TEXT,
  cashier_id TEXT NOT NULL,
  customer_name TEXT DEFAULT 'Pelanggan',
  order_type TEXT DEFAULT 'dine_in' CHECK(order_type IN ('dine_in', 'takeaway')),
  table_number TEXT,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'qris')),
  total_amount INTEGER NOT NULL,
  cash_tendered INTEGER DEFAULT 0, -- uang diterima
  change_amount INTEGER DEFAULT 0, -- kembalian
  status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'cancelled')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shift_id) REFERENCES shifts(id),
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_01_001','SUTE-261001-0001',NULL,'usr_kasir1','Meja 05','dine_in','05','cash',34000,40000,6000,'completed',NULL,'2026-10-01 11:20:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_01_002','SUTE-261001-0002',NULL,'usr_kasir1','Meja 08','dine_in','08','qris',7000,0,0,'completed',NULL,'2026-10-01 13:27:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_01_003','SUTE-261001-0003',NULL,'usr_kasir1','Mbak Rina','takeaway',NULL,'cash',45000,50000,5000,'completed',NULL,'2026-10-01 15:34:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_01_004','SUTE-261001-0004',NULL,'usr_kasir1','Mas Bayu','takeaway',NULL,'qris',22000,0,0,'completed',NULL,'2026-10-01 17:41:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_01_005','SUTE-261001-0005',NULL,'usr_kasir1','Mas Bowo','takeaway',NULL,'cash',12000,20000,8000,'completed',NULL,'2026-10-01 19:48:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_01_006','SUTE-261001-0006',NULL,'usr_kasir1','Meja 03','dine_in','03','qris',22000,0,0,'completed',NULL,'2026-10-01 21:55:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_01_007','SUTE-261001-0007',NULL,'usr_kasir1','Meja 06','dine_in','06','cash',34000,40000,6000,'completed',NULL,'2026-10-01 23:02:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_001','SUTE-261002-0001',NULL,'usr_kasir1','Meja 06','dine_in','06','qris',9000,0,0,'completed',NULL,'2026-10-02 10:33:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_002','SUTE-261002-0002',NULL,'usr_kasir1','Mas Dimas','takeaway',NULL,'cash',21000,30000,9000,'completed',NULL,'2026-10-02 12:40:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_003','SUTE-261002-0003',NULL,'usr_kasir1','Bang Rizal','takeaway',NULL,'qris',34000,0,0,'completed',NULL,'2026-10-02 14:47:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_004','SUTE-261002-0004',NULL,'usr_kasir1','Pak Hasan','takeaway',NULL,'cash',7000,10000,3000,'completed',NULL,'2026-10-02 16:54:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_005','SUTE-261002-0005',NULL,'usr_kasir1','Meja 01','dine_in','01','qris',35000,0,0,'completed',NULL,'2026-10-02 17:01:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_006','SUTE-261002-0006',NULL,'usr_kasir1','Meja 04','dine_in','04','cash',27000,30000,3000,'completed',NULL,'2026-10-02 19:08:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_007','SUTE-261002-0007',NULL,'usr_kasir1','Meja 07','dine_in','07','qris',12000,0,0,'completed',NULL,'2026-10-02 21:15:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_02_008','SUTE-261002-0008',NULL,'usr_kasir1','Pak Joko','takeaway',NULL,'cash',22000,30000,8000,'completed',NULL,'2026-10-02 23:22:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_001','SUTE-261003-0001',NULL,'usr_kasir1','Meja 07','dine_in','07','cash',15000,20000,5000,'completed',NULL,'2026-10-03 10:46:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_002','SUTE-261003-0002',NULL,'usr_kasir1','Pak Joko','takeaway',NULL,'qris',43000,0,0,'completed',NULL,'2026-10-03 11:53:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_003','SUTE-261003-0003',NULL,'usr_kasir1','Mas Arif','takeaway',NULL,'cash',9000,10000,1000,'completed',NULL,'2026-10-03 12:00:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_004','SUTE-261003-0004',NULL,'usr_kasir1','Mbak Citra','takeaway',NULL,'qris',15000,0,0,'completed',NULL,'2026-10-03 14:07:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_005','SUTE-261003-0005',NULL,'usr_kasir1','Meja 02','dine_in','02','cash',49000,50000,1000,'completed',NULL,'2026-10-03 15:14:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_006','SUTE-261003-0006',NULL,'usr_kasir1','Meja 05','dine_in','05','qris',7000,0,0,'completed',NULL,'2026-10-03 16:21:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_007','SUTE-261003-0007',NULL,'usr_kasir1','Meja 08','dine_in','08','cash',35000,40000,5000,'completed',NULL,'2026-10-03 17:28:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_008','SUTE-261003-0008',NULL,'usr_kasir1','Mbak Rina','takeaway',NULL,'qris',22000,0,0,'completed',NULL,'2026-10-03 19:35:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_009','SUTE-261003-0009',NULL,'usr_kasir1','Mas Bayu','takeaway',NULL,'cash',24000,30000,6000,'completed',NULL,'2026-10-03 20:42:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_010','SUTE-261003-0010',NULL,'usr_kasir1','Mas Bowo','takeaway',NULL,'qris',22000,0,0,'completed',NULL,'2026-10-03 21:49:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_03_011','SUTE-261003-0011',NULL,'usr_kasir1','Meja 03','dine_in','03','cash',25000,30000,5000,'completed',NULL,'2026-10-03 23:56:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_001','SUTE-261004-0001',NULL,'usr_kasir1','Meja 08','dine_in','08','qris',28000,0,0,'completed',NULL,'2026-10-04 10:59:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_002','SUTE-261004-0002',NULL,'usr_kasir1','Mbak Rina','takeaway',NULL,'cash',12000,20000,8000,'completed',NULL,'2026-10-04 11:06:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_003','SUTE-261004-0003',NULL,'usr_kasir1','Mas Bayu','takeaway',NULL,'qris',10000,0,0,'completed',NULL,'2026-10-04 12:13:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_004','SUTE-261004-0004',NULL,'usr_kasir1','Mas Bowo','takeaway',NULL,'cash',59000,60000,1000,'completed',NULL,'2026-10-04 13:20:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_005','SUTE-261004-0005',NULL,'usr_kasir1','Meja 03','dine_in','03','qris',9000,0,0,'completed',NULL,'2026-10-04 14:27:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_006','SUTE-261004-0006',NULL,'usr_kasir1','Meja 06','dine_in','06','cash',15000,20000,5000,'completed',NULL,'2026-10-04 15:34:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_007','SUTE-261004-0007',NULL,'usr_kasir1','Mas Dimas','takeaway',NULL,'qris',34000,0,0,'completed',NULL,'2026-10-04 16:41:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_008','SUTE-261004-0008',NULL,'usr_kasir1','Bang Rizal','takeaway',NULL,'cash',14000,20000,6000,'completed',NULL,'2026-10-04 17:48:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_009','SUTE-261004-0009',NULL,'usr_kasir1','Pak Hasan','takeaway',NULL,'qris',35000,0,0,'completed',NULL,'2026-10-04 18:55:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_010','SUTE-261004-0010',NULL,'usr_kasir1','Meja 01','dine_in','01','cash',22000,30000,8000,'completed',NULL,'2026-10-04 19:02:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_011','SUTE-261004-0011',NULL,'usr_kasir1','Meja 04','dine_in','04','qris',12000,0,0,'completed',NULL,'2026-10-04 20:09:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_012','SUTE-261004-0012',NULL,'usr_kasir1','Meja 07','dine_in','07','cash',35000,40000,5000,'completed',NULL,'2026-10-04 21:16:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_2610_04_013','SUTE-261004-0013',NULL,'usr_kasir1','Pak Joko','takeaway',NULL,'qris',25000,0,0,'completed',NULL,'2026-10-04 23:23:00');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791787379324','SUTE-261012-9303','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 06:42:59');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791788258289','SUTE-261012-9278','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 06:57:38');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791788557704','SUTE-261012-9162','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 07:02:37');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791788722149','SUTE-261012-2529','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 07:05:22');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791789124224','SUTE-261012-6712','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 07:12:04');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791800718127','SUTE-261012-1920','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 10:25:18');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791804639528','SUTE-261012-3575','shift_1791508277600','usr_owner','testing','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 11:30:39');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791805691936','SUTE-261012-4408','shift_1791508277600','usr_owner','tes','dine_in',NULL,'qris',15000,15000,0,'completed',NULL,'2026-10-12 11:48:11');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791806061260','SUTE-261012-1192','shift_1791508277600','usr_owner','tes','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 11:54:21');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791806156905','SUTE-261012-1197','shift_1791508277600','usr_kasir1','tes','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 11:55:56');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791807498680','SUTE-261012-4861','shift_1791508277600','usr_owner','tes','dine_in',NULL,'qris',7000,7000,0,'completed',NULL,'2026-10-12 12:18:18');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791807746710','SUTE-261012-3168','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',8000,8000,0,'completed',NULL,'2026-10-12 12:22:26');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1791808914396','SUTE-261012-4739','shift_1791508277600','usr_owner','tes','dine_in',NULL,'qris',17000,17000,0,'completed',NULL,'2026-10-12 12:41:54');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1792138026520','SUTE-261016-9233','shift_1791508277600','usr_owner','tes','dine_in',NULL,'qris',15000,15000,0,'completed',NULL,'2026-10-16 08:07:06');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1792724871089','SUTE-261023-7054','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',12000,12000,0,'completed',NULL,'2026-10-23 03:07:51');
INSERT INTO "orders" ("id","order_number","shift_id","cashier_id","customer_name","order_type","table_number","payment_method","total_amount","cash_tendered","change_amount","status","notes","created_at") VALUES('ord_1792724986687','SUTE-261023-2033','shift_1791508277600','usr_kasir1','Yudi','dine_in',NULL,'qris',7000,7000,0,'completed',NULL,'2026-10-23 03:09:46');
CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  notes TEXT, -- misal: "less sugar", "es pisah", "pedas"
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0001','ord_2610_01_001','prod_nasi_11','Nasi Gila',15000,1,15000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0002','ord_2610_01_001','prod_minum_3','Es Teh Jumbo',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0003','ord_2610_01_001','prod_cemil_2','Roti Bakar / Pisang Bakar',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0004','ord_2610_01_002','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0005','ord_2610_01_003','prod_minum_11','Xtrejoss Susu',10000,2,20000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0006','ord_2610_01_003','prod_cemil_7','Mix Platter',25000,1,25000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0007','ord_2610_01_004','prod_cemil_1','Aneka Gorengan',5000,1,5000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0008','ord_2610_01_004','prod_minum_8','Good Day Freeze',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0009','ord_2610_01_004','prod_cemil_5','Pancong Lumer',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0010','ord_2610_01_005','prod_kopi_6','Es Kopi Gula Aren',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0011','ord_2610_01_006','prod_mie_3','Indomie Single Telur',13000,1,13000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0012','ord_2610_01_006','prod_kopi_2','Kopi SKM',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0013','ord_2610_01_007','prod_cemil_3','Kentang Goreng',9000,2,18000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0014','ord_2610_01_007','prod_mie_1','Indomie Polos Single',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_01_0015','ord_2610_01_007','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0016','ord_2610_02_001','prod_cemil_5','Pancong Lumer',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0017','ord_2610_02_002','prod_minum_7','Nutrisari',6000,2,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0018','ord_2610_02_002','prod_cemil_3','Kentang Goreng',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0019','ord_2610_02_003','prod_nasi_11','Nasi Gila',15000,1,15000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0020','ord_2610_02_003','prod_minum_3','Es Teh Jumbo',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0021','ord_2610_02_003','prod_cemil_2','Roti Bakar / Pisang Bakar',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0022','ord_2610_02_004','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0023','ord_2610_02_005','prod_minum_11','Xtrejoss Susu',10000,1,10000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0024','ord_2610_02_005','prod_cemil_7','Mix Platter',25000,1,25000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0025','ord_2610_02_006','prod_cemil_1','Aneka Gorengan',5000,2,10000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0026','ord_2610_02_006','prod_minum_8','Good Day Freeze',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0027','ord_2610_02_006','prod_cemil_5','Pancong Lumer',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0028','ord_2610_02_007','prod_kopi_6','Es Kopi Gula Aren',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0029','ord_2610_02_008','prod_mie_3','Indomie Single Telur',13000,1,13000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_02_0030','ord_2610_02_008','prod_kopi_2','Kopi SKM',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0031','ord_2610_03_001','prod_minum_1','Teh Manis',5000,2,10000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0032','ord_2610_03_001','prod_cemil_1','Aneka Gorengan',5000,1,5000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0033','ord_2610_03_002','prod_mie_4','Indomie Telur Double',16000,1,16000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0034','ord_2610_03_002','prod_kopi_6','Es Kopi Gula Aren',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0035','ord_2610_03_002','prod_nasi_13','Nasi Goreng Sute',15000,1,15000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0036','ord_2610_03_003','prod_cemil_5','Pancong Lumer',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0037','ord_2610_03_004','prod_minum_7','Nutrisari',6000,1,6000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0038','ord_2610_03_004','prod_cemil_3','Kentang Goreng',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0039','ord_2610_03_005','prod_nasi_11','Nasi Gila',15000,2,30000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0040','ord_2610_03_005','prod_minum_3','Es Teh Jumbo',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0041','ord_2610_03_005','prod_cemil_2','Roti Bakar / Pisang Bakar',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0042','ord_2610_03_006','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0043','ord_2610_03_007','prod_minum_11','Xtrejoss Susu',10000,1,10000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0044','ord_2610_03_007','prod_cemil_7','Mix Platter',25000,1,25000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0045','ord_2610_03_008','prod_cemil_1','Aneka Gorengan',5000,1,5000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0046','ord_2610_03_008','prod_minum_8','Good Day Freeze',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0047','ord_2610_03_008','prod_cemil_5','Pancong Lumer',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0048','ord_2610_03_009','prod_kopi_6','Es Kopi Gula Aren',12000,2,24000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0049','ord_2610_03_010','prod_mie_3','Indomie Single Telur',13000,1,13000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0050','ord_2610_03_010','prod_kopi_2','Kopi SKM',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0051','ord_2610_03_011','prod_cemil_3','Kentang Goreng',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0052','ord_2610_03_011','prod_mie_1','Indomie Polos Single',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_03_0053','ord_2610_03_011','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0054','ord_2610_04_001','prod_mie_1','Indomie Polos Single',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0055','ord_2610_04_001','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0056','ord_2610_04_001','prod_nasi_1','Nasi Telur',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0057','ord_2610_04_002','prod_cemil_2','Roti Bakar / Pisang Bakar',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0058','ord_2610_04_003','prod_minum_1','Teh Manis',5000,1,5000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0059','ord_2610_04_003','prod_cemil_1','Aneka Gorengan',5000,1,5000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0060','ord_2610_04_004','prod_mie_4','Indomie Telur Double',16000,2,32000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0061','ord_2610_04_004','prod_kopi_6','Es Kopi Gula Aren',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0062','ord_2610_04_004','prod_nasi_13','Nasi Goreng Sute',15000,1,15000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0063','ord_2610_04_005','prod_cemil_5','Pancong Lumer',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0064','ord_2610_04_006','prod_minum_7','Nutrisari',6000,1,6000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0065','ord_2610_04_006','prod_cemil_3','Kentang Goreng',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0066','ord_2610_04_007','prod_nasi_11','Nasi Gila',15000,1,15000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0067','ord_2610_04_007','prod_minum_3','Es Teh Jumbo',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0068','ord_2610_04_007','prod_cemil_2','Roti Bakar / Pisang Bakar',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0069','ord_2610_04_008','prod_kopi_1','Kopi Tubruk',7000,2,14000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0070','ord_2610_04_009','prod_minum_11','Xtrejoss Susu',10000,1,10000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0071','ord_2610_04_009','prod_cemil_7','Mix Platter',25000,1,25000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0072','ord_2610_04_010','prod_cemil_1','Aneka Gorengan',5000,1,5000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0073','ord_2610_04_010','prod_minum_8','Good Day Freeze',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0074','ord_2610_04_010','prod_cemil_5','Pancong Lumer',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0075','ord_2610_04_011','prod_kopi_6','Es Kopi Gula Aren',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0076','ord_2610_04_012','prod_mie_3','Indomie Single Telur',13000,2,26000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0077','ord_2610_04_012','prod_kopi_2','Kopi SKM',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0078','ord_2610_04_013','prod_cemil_3','Kentang Goreng',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0079','ord_2610_04_013','prod_mie_1','Indomie Polos Single',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_2610_04_0080','ord_2610_04_013','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791787379513_0','ord_1791787379324','prod_minum_2','Teh Tarik',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791788258390_0','ord_1791788258289','prod_minum_2','Teh Tarik',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791788557732_0','ord_1791788557704','prod_minum_2','Teh Tarik',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791788722254_0','ord_1791788722149','prod_minum_2','Teh Tarik',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791789124394_0','ord_1791789124224','prod_minum_2','Teh Tarik',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791800718257_0','ord_1791800718127','prod_minum_2','Teh Tarik',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791804639573_0','ord_1791804639528','prod_kopi_3','Kopi Jahe',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791805691960_0','ord_1791805691936','prod_kopi_3','Kopi Jahe',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791805691970_1','ord_1791805691936','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791806061290_0','ord_1791806061260','prod_kopi_3','Kopi Jahe',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791806156928_0','ord_1791806156905','prod_kopi_3','Kopi Jahe',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791807498715_0','ord_1791807498680','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791807746748_0','ord_1791807746710','prod_minum_2','Teh Tarik',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791808914685_0','ord_1791808914396','prod_kopi_3','Kopi Jahe',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1791808914788_1','ord_1791808914396','prod_kopi_2','Kopi SKM',9000,1,9000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1792138026627_0','ord_1792138026520','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1792138026686_1','ord_1792138026520','prod_kopi_3','Kopi Jahe',8000,1,8000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1792724871181_0','ord_1792724871089','prod_kopi_6','Es Kopi Gula Aren',12000,1,12000,NULL);
INSERT INTO "order_items" ("id","order_id","product_id","product_name","price","quantity","subtotal","notes") VALUES('item_1792724986808_0','ord_1792724986687','prod_kopi_1','Kopi Tubruk',7000,1,7000,NULL);
CREATE TABLE shift_expenses (id TEXT PRIMARY KEY, shift_id TEXT NOT NULL, cashier_id TEXT, amount INTEGER NOT NULL, description TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_03_01','shift_pagi_01','usr_kasir1',50000,'Beli Jeruk Nipis & Cabai Pasar','2026-10-03 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_06_01','shift_pagi_01','usr_kasir1',35000,'Beli Galon Le Minerale & Gas LPG 3kg','2026-10-06 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_09_01','shift_pagi_01','usr_kasir1',25000,'Beli Sabun Cuci Piring & Spons','2026-10-09 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_12_01','shift_pagi_01','usr_kasir1',45000,'Beli Kantong Kresek & Sedotan','2026-10-12 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_15_01','shift_pagi_01','usr_kasir1',20000,'Beli Es Batu Kristal 2 Bal','2026-10-15 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_18_01','shift_pagi_01','usr_kasir1',50000,'Beli Jeruk Nipis & Cabai Pasar','2026-10-18 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_21_01','shift_pagi_01','usr_kasir1',35000,'Beli Galon Le Minerale & Gas LPG 3kg','2026-10-21 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_24_01','shift_pagi_01','usr_kasir1',25000,'Beli Sabun Cuci Piring & Spons','2026-10-24 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_27_01','shift_pagi_01','usr_kasir1',45000,'Beli Kantong Kresek & Sedotan','2026-10-27 15:00:00');
INSERT INTO "shift_expenses" ("id","shift_id","cashier_id","amount","description","created_at") VALUES('exp_2610_30_01','shift_pagi_01','usr_kasir1',20000,'Beli Es Batu Kristal 2 Bal','2026-10-30 15:00:00');
CREATE TABLE store_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "store_settings" ("key","value","updated_at") VALUES('receipt_config','{"storeName":"WARKOP SUDUT TEMU","tagline":"Kopi, Cerita, & Sudut Temu","address":"Jln. Raya Ciawi Gebang No 2, Kuningan","phone":"0812-3456-7890","socialMedia":"@warkopsuduttemu","footerMessage":"Terima Kasih Atas Kunjungannya!","footerSubmessage":"Ditunggu kunjungan berikutnya!","wifiName":"Warkop Sudut Temu","wifiPassword":"kopienak2026","paperWidth":"58mm","showStoreName":true,"showTagline":false,"showAddress":true,"showPhone":true,"showSocialMedia":true,"showCashierName":true,"showCustomerName":true,"showTableNumber":true,"showOrderType":true,"showItemNotes":true,"showWifiInfo":true,"showFooterMessage":true,"customNotice":"Barang yang sudah dibeli tidak dapat ditukar","showCustomNotice":false}','2026-10-05 01:51:42');
CREATE TABLE raw_materials (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        current_stock REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        min_stock_alert REAL NOT NULL DEFAULT 5,
        cost_per_unit INTEGER NOT NULL DEFAULT 0,
        supplier TEXT,
        last_restocked_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_kopi_robusta','Biji / Bubuk Kopi Robusta','Kopi & Minuman',12.5,'kg',3,85000,'Pengepul Kopi Temanggung','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_susu_skm','Susu Kental Manis (Carnation/Omela)','Kopi & Minuman',24,'kaleng',6,12500,'Toko Sembako Berkah','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_gas_3kg','Gas LPG 3kg Melon','Gas & Operasional',2,'tabung',2,22000,'Pangkalan Gas Barokah','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_es_kristal','Es Batu Kristal','Kopi & Minuman',4,'karung (10kg)',2,12000,'Depot Es Kristal Polar','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_air_galon','Air Galon Aqua / Le Minerale','Kopi & Minuman',5,'galon',3,19000,'Agen Galon Subur','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_gula_pasir','Gula Pasir Kristal Putih','Kopi & Minuman',15,'kg',4,17500,'Grosir Beras & Gula','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_indomie_goreng','Indomie Goreng Original','Bahan Makanan',65,'bungkus',20,2900,'Distributor Mie Instan','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_indomie_kuah','Indomie Kuah (Kari / Soto)','Bahan Makanan',40,'bungkus',15,2900,'Distributor Mie Instan','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_telur_ayam','Telur Ayam Segar','Bahan Makanan',75,'butir',20,1800,'Agen Telur Podomoro','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_teh_celup','Teh Celup / Tubruk (Tong Tji / Sariwangi)','Kopi & Minuman',8,'box',2,9500,'Toko Sembako Berkah','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_cup_takeaway','Cup Plastik & Tutup Sablon SUTE','Kemasan',180,'pcs',50,650,'Pabrik Kemasan Plastik','2026-10-04 14:01:55','2026-10-04 14:01:55');
INSERT INTO "raw_materials" ("id","name","category","current_stock","unit","min_stock_alert","cost_per_unit","supplier","last_restocked_at","created_at") VALUES('raw_kantong_kresek','Kantong Kresek Bening & Sedotan','Kemasan',12,'pak',3,7000,'Toko Plastik Makmur','2026-10-04 14:01:55','2026-10-04 14:01:55');
CREATE TABLE stock_movements (
        id TEXT PRIMARY KEY,
        material_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('in', 'out', 'waste', 'adjustment')),
        quantity REAL NOT NULL,
        notes TEXT,
        created_by_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
CREATE TABLE product_recipes (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        material_id TEXT NOT NULL,
        quantity_required REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, material_id)
      );
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_1','prod_1','raw_kopi_robusta',0.015,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_2_a','prod_2','raw_kopi_robusta',0.015,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_2_b','prod_2','raw_susu_skm',0.1,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_4_a','prod_4','raw_teh_celup',0.05,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_4_b','prod_4','raw_gula_pasir',0.02,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_7_a','prod_7','raw_indomie_goreng',1,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_7_b','prod_7','raw_telur_ayam',1,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_8_a','prod_8','raw_indomie_kuah',1,'2026-10-05 02:10:26');
INSERT INTO "product_recipes" ("id","product_id","material_id","quantity_required","created_at") VALUES('rec_8_b','prod_8','raw_telur_ayam',1,'2026-10-05 02:10:26');
CREATE TABLE overhead_expenses (id TEXT PRIMARY KEY, category TEXT NOT NULL, amount INTEGER NOT NULL, description TEXT NOT NULL, paid_date DATE NOT NULL, payment_source TEXT DEFAULT 'cash_drawer', recorded_by TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
INSERT INTO "overhead_expenses" ("id","category","amount","description","paid_date","payment_source","recorded_by","created_at") VALUES('ovh_sample_1','electricity',350000,'Token listrik meteran utama warkop','2026-10-02','owner_funds','Owner','2026-10-08 16:52:21');
INSERT INTO "overhead_expenses" ("id","category","amount","description","paid_date","payment_source","recorded_by","created_at") VALUES('ovh_sample_2','internet',275000,'Paket internet WiFi 50 Mbps warkop','2026-10-05','bank_transfer','Owner','2026-10-08 16:52:21');
INSERT INTO "overhead_expenses" ("id","category","amount","description","paid_date","payment_source","recorded_by","created_at") VALUES('ovh_1791479282661_d1jj','electricity',5000000,'Listrik PLN','2026-10-08','owner_funds','Owner','2026-10-08 17:08:02');
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);
CREATE INDEX idx_orders_shift ON orders(shift_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shift_expenses_shift ON shift_expenses(shift_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_stock_movements_mat ON stock_movements(material_id);
CREATE INDEX idx_overhead_date ON overhead_expenses(paid_date);
