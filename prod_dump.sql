--
-- PostgreSQL database dump
--

\restrict fOtwaK4kD6FI63ZL5bvxPG5UcRCP4slCp4KdB7wpwScDfaBuLxH7lJswMb1n2VJ

-- Dumped from database version 17.7 (178558d)
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.transactions DROP CONSTRAINT transactions_user_email_fkey;
ALTER TABLE ONLY public.transactions DROP CONSTRAINT transactions_subcategory_id_fkey;
ALTER TABLE ONLY public.transactions DROP CONSTRAINT transactions_category_id_fkey;
ALTER TABLE ONLY public.transactions DROP CONSTRAINT transactions_account_id_fkey;
ALTER TABLE ONLY public.subcategories DROP CONSTRAINT subcategories_category_id_fkey;
ALTER TABLE ONLY public.monthly_plans DROP CONSTRAINT monthly_plans_user_id_fkey;
ALTER TABLE ONLY public.monthly_plans DROP CONSTRAINT monthly_plans_subcategory_id_fkey;
ALTER TABLE ONLY public.monthly_plans DROP CONSTRAINT monthly_plans_category_id_fkey;
ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_user_id_fkey;
ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_user_id_fkey;
DROP INDEX public.categories_user_name_idx;
DROP INDEX public.accounts_user_name_idx;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY public.transactions DROP CONSTRAINT transactions_pkey;
ALTER TABLE ONLY public.subcategories DROP CONSTRAINT subcategories_pkey;
ALTER TABLE ONLY public.monthly_plans DROP CONSTRAINT monthly_plans_pkey;
ALTER TABLE ONLY public.email_otps DROP CONSTRAINT email_otps_pkey;
ALTER TABLE ONLY public.categories DROP CONSTRAINT categories_pkey;
ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_pkey;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.subcategories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.monthly_plans ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.email_otps ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.accounts ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.users_id_seq;
DROP TABLE public.users;
DROP SEQUENCE public.transactions_id_seq;
DROP TABLE public.transactions;
DROP SEQUENCE public.subcategories_id_seq;
DROP TABLE public.subcategories;
DROP SEQUENCE public.monthly_plans_id_seq;
DROP TABLE public.monthly_plans;
DROP SEQUENCE public.email_otps_id_seq;
DROP TABLE public.email_otps;
DROP SEQUENCE public.categories_id_seq;
DROP TABLE public.categories;
DROP SEQUENCE public.accounts_id_seq;
DROP TABLE public.accounts;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    user_id integer,
    color character varying(20) DEFAULT '#fbbf24'::character varying,
    default_currency character varying(3) DEFAULT 'AMD'::character varying,
    ordering integer DEFAULT 0,
    deleted_at timestamp with time zone,
    balance_amd numeric(15,2) DEFAULT 0,
    initial_balance numeric(15,2) DEFAULT 0,
    is_available boolean DEFAULT true
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    user_id integer,
    color character varying(20) DEFAULT '#fbbf24'::character varying,
    ordering integer DEFAULT 0,
    deleted_at timestamp with time zone,
    default_account_id integer,
    include_in_chart boolean DEFAULT true
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: email_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_otps (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    type character varying(20) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: email_otps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_otps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_otps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_otps_id_seq OWNED BY public.email_otps.id;


--
-- Name: monthly_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_plans (
    id integer NOT NULL,
    user_id integer,
    month character varying(7) NOT NULL,
    category_id integer,
    subcategory_id integer,
    amount numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reminder_date date
);


--
-- Name: monthly_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.monthly_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: monthly_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.monthly_plans_id_seq OWNED BY public.monthly_plans.id;


--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subcategories (
    id integer NOT NULL,
    category_id integer,
    name character varying(50) NOT NULL,
    ordering integer DEFAULT 0
);


--
-- Name: subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subcategories_id_seq OWNED BY public.subcategories.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_email character varying(255),
    amount numeric(12,2) NOT NULL,
    currency character varying(3) DEFAULT 'AMD'::character varying NOT NULL,
    category_name character varying(50),
    account_name character varying(50),
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    original_amount numeric(12,2),
    original_currency character varying(3),
    subcategory_id integer,
    account_id integer,
    category_id integer
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    first_name character varying(100),
    last_name character varying(100),
    image_url text,
    email_verified boolean DEFAULT false
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: email_otps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps ALTER COLUMN id SET DEFAULT nextval('public.email_otps_id_seq'::regclass);


--
-- Name: monthly_plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_plans ALTER COLUMN id SET DEFAULT nextval('public.monthly_plans_id_seq'::regclass);


--
-- Name: subcategories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories ALTER COLUMN id SET DEFAULT nextval('public.subcategories_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, name, user_id, color, default_currency, ordering, deleted_at, balance_amd, initial_balance, is_available) FROM stdin;
1	Current	3	#BDB2FF	AMD	0	\N	0.00	0.00	t
2	Card	3	#A0C4FF	AMD	0	\N	0.00	0.00	t
44	test	1	#fbbf24	USD	0	2025-12-12 13:46:23.934603+00	0.00	100.00	t
12	Card	4	#BAFFC9	AMD	0	\N	0.00	0.00	t
13	Cash	4	#FFFFBA	AMD	0	\N	0.00	0.00	t
14	Saving	4	#FFDFBA	AMD	0	\N	0.00	0.00	t
15	Cash $	4	#FFB3BA	USD	0	\N	0.00	0.00	t
43	Cash $	1	#ffd966	USD	0	\N	0.00	250.00	t
16	Card	5	#4a86e8	AMD	0	\N	0.00	0.00	t
17	Cash	5	#6aa84f	AMD	0	\N	0.00	0.00	t
18	Saving	5	#f1c232	AMD	0	\N	0.00	0.00	t
19	Card	9	#4a86e8	AMD	0	\N	0.00	0.00	t
20	Cash	9	#6aa84f	AMD	0	\N	0.00	0.00	t
21	Saving	9	#f1c232	AMD	0	\N	0.00	0.00	t
22	Card	10	#4a86e8	AMD	0	\N	0.00	0.00	t
23	Cash	10	#6aa84f	AMD	0	\N	0.00	0.00	t
24	Saving	10	#f1c232	AMD	0	\N	0.00	0.00	t
25	Card	11	#4a86e8	AMD	0	\N	0.00	0.00	t
26	Cash	11	#6aa84f	AMD	0	\N	0.00	0.00	t
27	Saving	11	#f1c232	AMD	0	\N	0.00	0.00	t
10	Overdraft	1	#e06666	AMD	0	\N	0.00	-2944100.00	f
9	Saving	1	#0b5394	AMD	0	\N	0.00	100000.00	t
7	Card $	1	#38761d	USD	0	\N	0.00	34.00	t
8	Card €	1	#6aa84f	EUR	0	\N	0.00	32.00	t
28	Card	12	#4a86e8	AMD	0	\N	0.00	0.00	t
29	Cash	12	#6aa84f	AMD	0	\N	0.00	0.00	t
30	Saving	12	#f1c232	AMD	0	\N	0.00	0.00	t
31	Card	13	#4a86e8	AMD	0	\N	0.00	0.00	t
32	Cash	13	#6aa84f	AMD	0	\N	0.00	0.00	t
33	Saving	13	#f1c232	AMD	0	\N	0.00	0.00	t
34	Card	14	#4a86e8	AMD	0	\N	0.00	0.00	t
35	Cash	14	#6aa84f	AMD	0	\N	0.00	0.00	t
36	Saving	14	#f1c232	AMD	0	\N	0.00	0.00	t
37	Card	15	#4a86e8	AMD	0	\N	0.00	0.00	t
38	Cash	15	#6aa84f	AMD	0	\N	0.00	0.00	t
39	Saving	15	#f1c232	AMD	0	\N	0.00	0.00	t
40	Card	16	#4a86e8	AMD	0	\N	0.00	0.00	t
41	Cash	16	#6aa84f	AMD	0	\N	0.00	0.00	t
42	Saving	16	#f1c232	AMD	0	\N	0.00	0.00	t
11	Cash $	1	#ffd966	USD	0	2025-12-12 13:12:16.730567+00	0.00	249.99	t
6	Ameria	1	#274e13	AMD	0	\N	0.00	3900.00	t
3	Card	1	#38761d	AMD	0	\N	0.00	462100.00	t
5	IDBank	1	#e69138	AMD	0	\N	0.00	3300.00	t
4	Cash	1	#ffd966	AMD	0	\N	0.00	100000.00	t
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, user_id, color, ordering, deleted_at, default_account_id, include_in_chart) FROM stdin;
8	Care	1	#c27ba0	0	\N	3	t
3	Mortgage	1	#073763	0	\N	3	t
18	Home	1	#073763	0	\N	3	t
5	Lunch	1	#dd7e6b	0	\N	3	t
6	Eating Out	1	#dd7e6b	0	\N	3	t
17	Entertainment	1	#f1c232	0	\N	3	t
7	Grocery	1	#674ea7	0	\N	3	t
12	Shopping	1	#a64d79	0	\N	3	t
34	Bill	9	#cc0000	1	\N	\N	t
35	Food	9	#e69138	2	\N	\N	t
36	Grocery	9	#f6b26b	3	\N	\N	t
37	Salary	9	#38761d	4	\N	\N	t
38	Transport	9	#3d85c6	5	\N	\N	t
39	Bill	10	#cc0000	1	\N	\N	t
40	Food	10	#e69138	2	\N	\N	t
41	Grocery	10	#f6b26b	3	\N	\N	t
42	Salary	10	#38761d	4	\N	\N	t
43	Transport	10	#3d85c6	5	\N	\N	t
44	Bill	11	#cc0000	1	\N	\N	t
45	Food	11	#e69138	2	\N	\N	t
46	Grocery	11	#f6b26b	3	\N	\N	t
47	Salary	11	#38761d	4	\N	\N	t
2	Services	3	#FFDFBA	0	\N	\N	t
4	Utils	3	#BAFFC9	0	\N	\N	t
48	Transport	11	#3d85c6	5	\N	\N	t
49	Bill	12	#cc0000	1	\N	\N	t
50	Food	12	#e69138	2	\N	\N	t
51	Grocery	12	#f6b26b	3	\N	\N	t
14	Wage	3	#A0C4FF	0	\N	\N	t
52	Salary	12	#38761d	4	\N	\N	t
53	Transport	12	#3d85c6	5	\N	\N	t
54	Bill	13	#cc0000	1	\N	\N	t
55	Food	13	#e69138	2	\N	\N	t
56	Grocery	13	#f6b26b	3	\N	\N	t
57	Salary	13	#38761d	4	\N	\N	t
58	Transport	13	#3d85c6	5	\N	\N	t
59	Bill	14	#cc0000	1	\N	\N	t
60	Food	14	#e69138	2	\N	\N	t
61	Grocery	14	#f6b26b	3	\N	\N	t
62	Salary	14	#38761d	4	\N	\N	t
63	Transport	14	#3d85c6	5	\N	\N	t
64	Bill	15	#cc0000	1	\N	\N	t
65	Food	15	#e69138	2	\N	\N	t
66	Grocery	15	#f6b26b	3	\N	\N	t
67	Salary	15	#38761d	4	\N	\N	t
68	Transport	15	#3d85c6	5	\N	\N	t
69	Bill	16	#cc0000	1	\N	\N	t
70	Food	16	#e69138	2	\N	\N	t
71	Grocery	16	#f6b26b	3	\N	\N	t
72	Salary	16	#38761d	4	\N	\N	t
73	Transport	16	#3d85c6	5	\N	\N	t
22	Transfer	1	#b1aaaa	0	\N	3	f
16	Other	1	#b3adad	0	\N	3	f
23	Bill	4	#B29DD9	1	\N	\N	t
24	Food	4	#FDFD96	2	\N	\N	t
25	Grocery	4	#87CEFA	3	\N	\N	t
26	Salary	4	#F49AC2	4	\N	\N	t
27	Transport	4	#CB99C9	5	\N	\N	t
28	Transfer	4	#C23B22	0	\N	\N	f
29	Bill	5	#cc0000	1	\N	\N	t
30	Food	5	#e69138	2	\N	\N	t
31	Grocery	5	#f6b26b	3	\N	\N	t
32	Salary	5	#38761d	4	\N	\N	t
33	Transport	5	#3d85c6	5	\N	\N	t
1	Bill	1	#f6b26b	0	\N	3	t
9	Car	1	#434343	0	\N	3	t
10	Petrol	1	#434343	0	\N	3	t
11	Transport	1	#434343	0	\N	3	t
15	Travel	1	#0b5394	0	\N	3	t
20	Tax Return	1	#6aa84f	0	\N	3	f
19	Salary	1	#6aa84f	0	\N	3	f
21	Interest	1	#6aa84f	0	\N	3	f
13	Gift	1	#e06666	0	\N	3	t
\.


--
-- Data for Name: email_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_otps (id, email, code, type, expires_at, created_at) FROM stdin;
6	armarty5@gmail.com	523448	RESET	2025-12-12 12:18:53.147	2025-12-12 12:08:53.148695
12	armarty5+9@gmail.com	133904	RESET	2025-12-12 12:29:57.259	2025-12-12 12:19:57.26057
15	armarty5+10@gmail.com	516685	RESET	2025-12-12 12:36:11.976	2025-12-12 12:26:11.987017
\.


--
-- Data for Name: monthly_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.monthly_plans (id, user_id, month, category_id, subcategory_id, amount, created_at, reminder_date) FROM stdin;
1	3	2025-12	2	\N	3000.00	2025-12-11 17:31:27.645504	\N
3	1	2025-12	1	7	-500.00	2025-12-11 19:18:21.360632	\N
4	1	2025-12	1	10	-500.00	2025-12-11 19:18:25.027973	\N
5	1	2025-12	1	4	-11000.00	2025-12-11 19:18:30.889084	\N
6	1	2025-12	1	3	-50000.00	2025-12-11 19:18:36.646074	\N
7	1	2025-12	1	8	-1000.00	2025-12-11 19:18:41.632066	\N
8	1	2025-12	1	6	-10000.00	2025-12-11 19:18:47.519421	\N
9	1	2025-12	1	11	-3200.00	2025-12-11 19:18:52.167583	\N
10	1	2025-12	1	9	-2000.00	2025-12-11 19:18:56.862159	\N
11	1	2025-12	1	5	-5000.00	2025-12-11 19:19:00.386096	\N
14	1	2025-12	7	\N	-150000.00	2025-12-11 19:36:59.864397	\N
17	1	2025-12	9	21	-6000.00	2025-12-11 20:46:07.469795	\N
18	1	2025-12	10	\N	-25000.00	2025-12-11 20:46:22.036316	\N
19	1	2025-12	8	22	-30000.00	2025-12-11 20:47:02.764721	\N
20	1	2025-12	8	16	-20000.00	2025-12-11 20:47:14.642262	\N
21	1	2025-12	8	17	-15000.00	2025-12-11 20:47:18.808463	\N
23	1	2025-12	5	\N	-50000.00	2025-12-11 20:47:36.361239	\N
24	1	2025-12	6	\N	-30000.00	2025-12-11 20:47:45.559931	\N
25	1	2025-12	12	\N	-100000.00	2025-12-11 20:49:07.807698	\N
26	1	2025-12	13	\N	-200000.00	2025-12-11 20:49:14.120704	\N
27	1	2025-12	18	\N	-200000.00	2025-12-11 20:49:22.693257	\N
28	1	2025-12	19	\N	1700000.00	2025-12-11 20:49:30.797519	\N
29	5	2025-12	30	\N	-20000.00	2025-12-12 06:57:40.731363	\N
31	1	2026-01	1	7	-500.00	2025-12-12 09:45:49.192105	\N
32	1	2026-01	1	10	-500.00	2025-12-12 09:45:49.206403	\N
33	1	2026-01	1	4	-11000.00	2025-12-12 09:45:49.209903	\N
34	1	2026-01	1	3	-50000.00	2025-12-12 09:45:49.213257	\N
35	1	2026-01	1	8	-1000.00	2025-12-12 09:45:49.216661	\N
36	1	2026-01	1	6	-10000.00	2025-12-12 09:45:49.220195	\N
37	1	2026-01	1	11	-3200.00	2025-12-12 09:45:49.223746	\N
38	1	2026-01	1	9	-2000.00	2025-12-12 09:45:49.226952	\N
39	1	2026-01	1	5	-5000.00	2025-12-12 09:45:49.230505	\N
40	1	2026-01	7	\N	-150000.00	2025-12-12 09:45:49.233984	\N
41	1	2026-01	3	\N	-420000.00	2025-12-12 09:45:49.237238	\N
42	1	2026-01	9	21	-6000.00	2025-12-12 09:45:49.240572	\N
43	1	2026-01	10	\N	-25000.00	2025-12-12 09:45:49.243833	\N
44	1	2026-01	8	22	-30000.00	2025-12-12 09:45:49.247161	\N
45	1	2026-01	8	16	-20000.00	2025-12-12 09:45:49.250474	\N
46	1	2026-01	8	17	-15000.00	2025-12-12 09:45:49.253677	\N
47	1	2026-01	8	24	-10000.00	2025-12-12 09:45:49.257406	\N
48	1	2026-01	5	\N	-50000.00	2025-12-12 09:45:49.261054	\N
49	1	2026-01	6	\N	-30000.00	2025-12-12 09:45:49.264279	\N
50	1	2026-01	12	\N	-100000.00	2025-12-12 09:45:49.267768	\N
52	1	2026-01	18	\N	-200000.00	2025-12-12 09:45:49.274468	\N
53	1	2026-01	19	\N	1700000.00	2025-12-12 09:45:49.278023	\N
22	1	2025-12	8	24	-10000.00	2025-12-11 20:47:27.875635	2025-12-13
16	1	2025-12	3	\N	-420000.00	2025-12-11 20:45:41.686985	2025-12-17
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subcategories (id, category_id, name, ordering) FROM stdin;
1	2	Online	0
2	2	Offline	0
3	1	Gas	0
4	1	Electricity	0
5	1	Water	0
6	1	Internet	0
7	1	Apple	0
8	1	Google	0
9	1	Spotify	0
10	1	Bank	0
11	1	Phone	0
12	1	Property Tax	0
13	1	Garbage Collection	0
14	1	Condominium	0
15	1	Insurance	0
16	8	Nails	0
17	8	Hair	0
18	9	Parking	0
19	9	UI	0
20	9	Nshteh	0
21	9	Wash	0
22	8	G	0
23	8	Elos	0
24	8	OC	0
25	8	Dental	0
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, user_email, amount, currency, category_name, account_name, note, created_at, original_amount, original_currency, subcategory_id, account_id, category_id) FROM stdin;
1	aram@movato.com	-1000.00	AMD	\N	\N	Some note	2025-12-11 17:29:39.435743	\N	\N	1	2	2
2	aram@movato.com	10000.00	AMD	\N	\N		2025-12-11 17:30:32.959069	\N	\N	\N	2	14
5	armarty5@gmail.com	-1000.00	AMD	\N	\N	Antigravity	2025-12-11 18:22:37.74051	\N	\N	\N	3	1
10	armarty5@gmail.com	-3200.00	AMD	\N	\N		2025-12-11 18:23:37.808366	\N	\N	11	3	1
11	armarty5@gmail.com	-2000.00	AMD	\N	\N		2025-12-11 18:23:49.161588	\N	\N	9	3	1
12	armarty5@gmail.com	-500.00	AMD	\N	\N		2025-12-11 18:24:01.652126	\N	\N	10	3	1
13	armarty5@gmail.com	800.00	AMD	\N	\N		2025-12-11 18:24:49.441712	\N	\N	\N	3	21
14	armarty5@gmail.com	-30000.00	AMD	\N	\N	😼 doctor	2025-12-11 18:25:12.1926	\N	\N	\N	4	8
15	armarty5@gmail.com	-9900.00	AMD	\N	\N	Internet	2025-12-11 18:25:55.835816	\N	\N	6	3	1
16	armarty5@gmail.com	-10800.00	AMD	\N	\N		2025-12-11 18:26:09.171601	\N	\N	4	3	1
17	armarty5@gmail.com	-46400.00	AMD	\N	\N		2025-12-11 18:26:14.863113	\N	\N	3	3	1
18	armarty5@gmail.com	-10000.00	AMD	\N	\N	wb	2025-12-11 18:29:28.263438	\N	\N	\N	6	7
19	armarty5+1@gmail.com	-40000.00	AMD	\N	\N	Transfer to Cash $	2025-12-11 19:10:00	\N	\N	\N	13	28
20	armarty5+1@gmail.com	100.00	USD	\N	\N	Transfer from Cash	2025-12-11 19:10:00	\N	\N	\N	15	28
21	armarty5+1@gmail.com	-100000.00	AMD	\N	\N	Transfer to Card	2025-12-11 19:10:00	\N	\N	\N	14	28
22	armarty5+1@gmail.com	100000.00	AMD	\N	\N	Transfer from Saving	2025-12-11 19:10:00	\N	\N	\N	12	28
23	armarty5@gmail.com	-8900.00	AMD	\N	\N	finflow42.com domain	2025-12-11 00:00:00	\N	\N	\N	3	1
24	armarty5@gmail.com	-13440.00	AMD	\N	\N	Nike swimsuit	2025-12-11 00:00:00	-32.00	EUR	\N	8	12
25	armarty5@gmail.com	-4600.00	AMD	\N	\N	marash	2025-12-11 00:00:00	\N	\N	\N	5	16
26	armarty5@gmail.com	1900.00	AMD	\N	\N		2025-12-11 00:00:00	\N	\N	\N	5	5
28	armarty5@gmail.com	-13600.00	AMD	\N	\N	Amazon clay and essie	2025-12-11 00:00:00	-34.00	USD	\N	7	12
29	armarty5@gmail.com	-61800.00	AMD	\N	\N		2025-12-11 00:00:00	\N	\N	\N	3	5
30	armarty5@gmail.com	33500.00	AMD	\N	\N		2025-12-11 00:00:00	\N	\N	\N	6	5
31	armarty5@gmail.com	-7000.00	AMD	\N	\N		2025-12-11 00:00:00	\N	\N	16	6	8
32	armarty5@gmail.com	-600.00	AMD	\N	\N		2025-12-11 00:00:00	\N	\N	18	3	9
33	armarty5@gmail.com	-41100.00	AMD	\N	\N		2025-12-11 00:00:00	\N	\N	\N	3	7
34	armarty5@gmail.com	-20700.00	AMD	\N	\N	office secret santa charlottetilbury	2025-12-11 00:00:00	\N	\N	\N	3	13
35	armarty5@gmail.com	-30000.00	AMD	\N	\N	BBA body balm	2025-12-11 00:00:00	\N	\N	\N	3	12
36	armarty5@gmail.com	-8000.00	AMD	\N	\N	Corpus	2025-12-11 00:00:00	\N	\N	\N	3	6
38	armarty5@gmail.com	-20200.00	AMD	\N	\N	Gog hybuys	2025-12-11 00:00:00	\N	\N	\N	3	16
41	armarty5@gmail.com	-68400.00	AMD	\N	\N	mixed stuff, glb, wb	2025-12-11 00:00:00	\N	\N	\N	3	12
42	armarty5@gmail.com	-1300.00	AMD	\N	\N		2025-12-11 00:00:00	\N	\N	\N	3	11
43	armarty5@gmail.com	-4700.00	AMD	\N	\N	flaconi	2025-12-11 00:00:00	\N	\N	\N	3	16
51	armarty5@gmail.com	-20000.00	AMD	\N	\N	Transfer to Cash	2025-12-12 00:00:00	\N	\N	\N	3	22
52	armarty5@gmail.com	20000.00	AMD	\N	\N	Transfer from Card	2025-12-12 00:00:00	\N	\N	\N	4	22
54	armarty5@gmail.com	4300.00	AMD	\N	\N		2025-12-12 00:00:00	\N	\N	\N	6	5
55	armarty5@gmail.com	-16000.00	AMD	\N	\N		2025-12-12 00:00:00	\N	\N	\N	3	5
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, created_at, first_name, last_name, image_url, email_verified) FROM stdin;
1	armarty5@gmail.com	$2b$10$j5NsF2xFfBWYyOYNqeUNUeE0iOoiV3Pzgk99KtmmrFQnFbrQkHsOO	2025-12-11 17:25:31.254109	Arevik	Martirosyan	data:image/jpeg;base64,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	t
13	armarty5+8@gmail.com	$2b$10$xi7cQl6zUTAIi8mxFNoHwOUuO17bbb.8.6OhZQyP14ZqD3rAx57im	2025-12-12 12:14:50.874771	arev	eight	\N	t
14	armarty5+9@gmail.com	$2b$10$605MxyPHHYMHTckDNEJKZeIoj9VEUsKO1ncRMEuNXJ4Vvqv0p2kye	2025-12-12 12:17:31.849052	arev	nine	\N	t
15	armarty5+10@gmail.com	$2b$10$W2hRSCSG0YH3zFhcY0EwJehXVfKxlEBK9gOy44JTO7ZcA8blBIpp.	2025-12-12 12:21:38.605999	arev	ten	\N	t
16	armarty5+11@gmail.com	$2b$10$BZ7dQcLDG5uzbmqG71XZ3eYuusC7pGT1WXFek6icmTmpNRYilRci6	2025-12-12 12:27:14.847057	11	11	\N	t
2	artashvt@gmail.com	$2b$10$w3.TfjWHPl2CsqtcOPBI6OJV0op2.5GcChH21Z6ll9iq9r/jdIq/W	2025-12-11 17:26:48.149458	Artashes	Amiryan	\N	t
3	aram@movato.com	$2b$10$fcGRD4U.GuH1nbMaMn37x.E1.fhX6MCBkaeBLaY/TkxkNurpFV3yO	2025-12-11 17:27:07.479096	Aram	Baghdasaryan		t
4	armarty5+1@gmail.com	$2b$10$e0c9ovSw0uZ3XmIAeT4F1..1W6DaVafoJX3L7tzEztf.Qn0xlFdY6	2025-12-11 19:05:28.77739	Arevik	One	\N	t
5	aniisahakyana5@gmail.com	$2b$10$ih/QxEFEJ//vFKXXY7tHJ.G7iuAjLeHajhyobGl2WtpX2Bgq3wWEG	2025-12-12 06:55:03.842283	Ani	Isahakyan	data:image/jpeg;base64,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	t
9	arevik.martirosyan@movato.com	\N	2025-12-12 11:08:29.139714	Arevik	Martirosyan	https://lh3.googleusercontent.com/a/ACg8ocLsJfEGTnzATEp45dmrCQx2oBHWJ1NJe9CUDt9PzUHu6xqrubG-=s96-c	t
10	armarty5+2@gmail.com	$2b$10$xdUHUeqPdpjFUUaM.GtUWOpLRRSfxjYXje9CFPYnj.YArH6.1Pjoq	2025-12-12 11:32:31.067365	Arev	Two	\N	t
11	armarty5+3@gmail.com	$2b$10$15xEQWpKGHgCiEpex0bINuQ3Kcrz8kQLDjDsJ3mK64Cb4xcZKYj.e	2025-12-12 11:39:47.868274	Arevik	Martirosyan	\N	t
12	armarty5+7@gmail.com	$2b$10$zn68NiIyqCFV09c7v7og1ejgJpqXRZ2IDSA6UTzb6KVwoVruE4e.e	2025-12-12 12:03:00.351784	arevik	six	\N	t
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 44, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 73, true);


--
-- Name: email_otps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_otps_id_seq', 18, true);


--
-- Name: monthly_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.monthly_plans_id_seq', 53, true);


--
-- Name: subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subcategories_id_seq', 25, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 55, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: email_otps email_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_otps
    ADD CONSTRAINT email_otps_pkey PRIMARY KEY (id);


--
-- Name: monthly_plans monthly_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_plans
    ADD CONSTRAINT monthly_plans_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_user_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX accounts_user_name_idx ON public.accounts USING btree (user_id, name) WHERE (deleted_at IS NULL);


--
-- Name: categories_user_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_user_name_idx ON public.categories USING btree (user_id, name) WHERE (deleted_at IS NULL);


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: categories categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: monthly_plans monthly_plans_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_plans
    ADD CONSTRAINT monthly_plans_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: monthly_plans monthly_plans_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_plans
    ADD CONSTRAINT monthly_plans_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: monthly_plans monthly_plans_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_plans
    ADD CONSTRAINT monthly_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: subcategories subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: transactions transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: transactions transactions_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--
-- Name: transactions transactions_user_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_email_fkey FOREIGN KEY (user_email) REFERENCES public.users(email);


--
-- PostgreSQL database dump complete
--

\unrestrict fOtwaK4kD6FI63ZL5bvxPG5UcRCP4slCp4KdB7wpwScDfaBuLxH7lJswMb1n2VJ

