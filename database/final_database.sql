--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

-- Started on 2025-10-30 14:49:45

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 254 (class 1255 OID 16873)
-- Name: log_game_changes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_game_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (table_name, operation_type, new_data, changed_by)
        VALUES ('game', 'INSERT', to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (table_name, operation_type, old_data, new_data, changed_by)
        VALUES ('game', 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (table_name, operation_type, old_data, changed_by)
        VALUES ('game', 'DELETE', to_jsonb(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.log_game_changes() OWNER TO postgres;

--
-- TOC entry 255 (class 1255 OID 16862)
-- Name: purchase_game(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.purchase_game(IN p_user_id integer, IN p_game_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
   v_price NUMERIC(10, 2);
   v_lic_id INTEGER;
BEGIN
   -- Get the price of the game from its primary license
   SELECT l.price INTO v_price
   FROM license l
   JOIN belong_to bt ON l.lic_id = bt.lic_id
   WHERE bt.game_id = p_game_id
   LIMIT 1;

   -- Check if the user has enough money
   IF (SELECT wallet_balance FROM "user" WHERE user_id = p_user_id) < v_price THEN
      RAISE EXCEPTION 'Insufficient funds.';
   END IF;
   
   -- 1. Deduct money from wallet
   UPDATE "user" SET wallet_balance = wallet_balance - v_price WHERE user_id = p_user_id;

   -- 2. Create a new license for this purchase
   INSERT INTO license (price, validity, date_of_purchase) 
   VALUES (v_price, '1 year', NOW()) RETURNING lic_id INTO v_lic_id;
   
   -- 3. Link the license to the game
   INSERT INTO belong_to (lic_id, game_id) VALUES (v_lic_id, p_game_id);
   
   -- 4. Link the user to the new license (give them ownership)
   INSERT INTO owns (user_id, lic_id) VALUES (p_user_id, v_lic_id);
   
   -- 5. Log the successful purchase
   INSERT INTO purchase_log (user_id, game_id, price_paid) VALUES (p_user_id, p_game_id, v_price);
   
   -- If all steps succeed, the transaction will be committed.
   -- If any step fails, the EXCEPTION block will catch it and roll back.
EXCEPTION
   WHEN OTHERS THEN
      -- An error occurred, roll back all changes
      RAISE NOTICE 'An error occurred. Rolling back transaction.';
      RAISE; -- Re-raise the original error
END;
$$;


ALTER PROCEDURE public.purchase_game(IN p_user_id integer, IN p_game_id integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 238 (class 1259 OID 16944)
-- Name: achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.achievements (
    achievement_id integer NOT NULL,
    achievement_name character varying(100) NOT NULL,
    description text NOT NULL,
    icon_name character varying(50) DEFAULT 'Trophy'::character varying
);


ALTER TABLE public.achievements OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16943)
-- Name: achievements_achievement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.achievements_achievement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.achievements_achievement_id_seq OWNER TO postgres;

--
-- TOC entry 4969 (class 0 OID 0)
-- Dependencies: 237
-- Name: achievements_achievement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.achievements_achievement_id_seq OWNED BY public.achievements.achievement_id;


--
-- TOC entry 234 (class 1259 OID 16864)
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    log_id integer NOT NULL,
    table_name text NOT NULL,
    operation_type text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_by text,
    changed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16863)
-- Name: audit_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_log_log_id_seq OWNER TO postgres;

--
-- TOC entry 4970 (class 0 OID 0)
-- Dependencies: 233
-- Name: audit_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_log_log_id_seq OWNED BY public.audit_log.log_id;


--
-- TOC entry 228 (class 1259 OID 16797)
-- Name: belong_to; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.belong_to (
    lic_id integer NOT NULL,
    game_id integer NOT NULL
);


ALTER TABLE public.belong_to OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 17044)
-- Name: contact_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_submissions (
    submission_id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(255),
    message text NOT NULL,
    received_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.contact_submissions OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17043)
-- Name: contact_submissions_submission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.contact_submissions_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_submissions_submission_id_seq OWNER TO postgres;

--
-- TOC entry 4971 (class 0 OID 0)
-- Dependencies: 241
-- Name: contact_submissions_submission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.contact_submissions_submission_id_seq OWNED BY public.contact_submissions.submission_id;


--
-- TOC entry 226 (class 1259 OID 16776)
-- Name: developers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.developers (
    dev_id integer NOT NULL,
    dev_name character varying(100) NOT NULL,
    dev_loc character varying(100),
    revenue numeric(15,2),
    fight_complexity character varying(50),
    combat_style character varying(50),
    lore_depth character varying(50),
    gp_type character varying(50),
    mp_mode character varying(50),
    pvp character varying(10)
);


ALTER TABLE public.developers OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16775)
-- Name: developers_dev_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.developers_dev_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.developers_dev_id_seq OWNER TO postgres;

--
-- TOC entry 4972 (class 0 OID 0)
-- Dependencies: 225
-- Name: developers_dev_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.developers_dev_id_seq OWNED BY public.developers.dev_id;


--
-- TOC entry 240 (class 1259 OID 16969)
-- Name: friends; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friends (
    user_one_id integer NOT NULL,
    user_two_id integer NOT NULL,
    status character varying(20) NOT NULL,
    action_user_id integer,
    CONSTRAINT check_user_order CHECK ((user_one_id < user_two_id)),
    CONSTRAINT friends_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'blocked'::character varying])::text[])))
);


ALTER TABLE public.friends OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16737)
-- Name: game; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.game (
    game_id integer NOT NULL,
    title character varying(200) NOT NULL,
    genre character varying(50),
    rating numeric(3,1),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    price numeric(10,2) DEFAULT 49.99 NOT NULL,
    image_url character varying(255),
    CONSTRAINT game_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (10)::numeric)))
);


ALTER TABLE public.game OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16736)
-- Name: game_game_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.game_game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.game_game_id_seq OWNER TO postgres;

--
-- TOC entry 4973 (class 0 OID 0)
-- Dependencies: 219
-- Name: game_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.game_game_id_seq OWNED BY public.game.game_id;


--
-- TOC entry 218 (class 1259 OID 16730)
-- Name: license; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.license (
    lic_id integer NOT NULL,
    price numeric(10,2) NOT NULL,
    validity interval,
    date_of_purchase date NOT NULL
);


ALTER TABLE public.license OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16729)
-- Name: license_lic_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.license_lic_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.license_lic_id_seq OWNER TO postgres;

--
-- TOC entry 4974 (class 0 OID 0)
-- Dependencies: 217
-- Name: license_lic_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.license_lic_id_seq OWNED BY public.license.lic_id;


--
-- TOC entry 227 (class 1259 OID 16782)
-- Name: owns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.owns (
    user_id integer NOT NULL,
    lic_id integer NOT NULL
);


ALTER TABLE public.owns OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16845)
-- Name: purchase_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_log (
    purchase_id integer NOT NULL,
    user_id integer,
    game_id integer,
    price_paid numeric(10,2),
    purchase_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.purchase_log OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16844)
-- Name: purchase_log_purchase_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_log_purchase_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_log_purchase_id_seq OWNER TO postgres;

--
-- TOC entry 4975 (class 0 OID 0)
-- Dependencies: 231
-- Name: purchase_log_purchase_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_log_purchase_id_seq OWNED BY public.purchase_log.purchase_id;


--
-- TOC entry 222 (class 1259 OID 16745)
-- Name: review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.review (
    review_id integer NOT NULL,
    game_id integer,
    user_id integer,
    user_exp text,
    feedback text,
    recommendations text
);


ALTER TABLE public.review OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16744)
-- Name: review_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.review_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_review_id_seq OWNER TO postgres;

--
-- TOC entry 4976 (class 0 OID 0)
-- Dependencies: 221
-- Name: review_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.review_review_id_seq OWNED BY public.review.review_id;


--
-- TOC entry 229 (class 1259 OID 16812)
-- Name: rights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rights (
    dev_id integer NOT NULL,
    game_id integer NOT NULL
);


ALTER TABLE public.rights OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16925)
-- Name: scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scores (
    score_id integer NOT NULL,
    user_id integer,
    game_id integer,
    score integer NOT NULL,
    achieved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.scores OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16924)
-- Name: scores_score_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scores_score_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scores_score_id_seq OWNER TO postgres;

--
-- TOC entry 4977 (class 0 OID 0)
-- Dependencies: 235
-- Name: scores_score_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scores_score_id_seq OWNED BY public.scores.score_id;


--
-- TOC entry 216 (class 1259 OID 16721)
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    user_id integer NOT NULL,
    f_name character varying(50) NOT NULL,
    l_name character varying(50) NOT NULL,
    date_of_join date NOT NULL,
    email character varying(100) NOT NULL,
    wallet_balance numeric(10,2) DEFAULT 100.00 NOT NULL,
    password_hash character varying(255) DEFAULT 'temporary_password'::character varying NOT NULL,
    role character varying(10) DEFAULT 'user'::character varying NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16953)
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_achievements (
    user_id integer NOT NULL,
    achievement_id integer NOT NULL,
    unlocked_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_achievements OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16764)
-- Name: user_list; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_list (
    list_id integer NOT NULL,
    user_id integer,
    no_of_games integer
);


ALTER TABLE public.user_list OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16763)
-- Name: user_list_list_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_list_list_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_list_list_id_seq OWNER TO postgres;

--
-- TOC entry 4978 (class 0 OID 0)
-- Dependencies: 223
-- Name: user_list_list_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_list_list_id_seq OWNED BY public.user_list.list_id;


--
-- TOC entry 215 (class 1259 OID 16720)
-- Name: user_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_user_id_seq OWNER TO postgres;

--
-- TOC entry 4979 (class 0 OID 0)
-- Dependencies: 215
-- Name: user_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_user_id_seq OWNED BY public."user".user_id;


--
-- TOC entry 230 (class 1259 OID 16827)
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wishlist_items (
    list_id integer NOT NULL,
    game_id integer NOT NULL
);


ALTER TABLE public.wishlist_items OWNER TO postgres;

--
-- TOC entry 4727 (class 2604 OID 16947)
-- Name: achievements achievement_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements ALTER COLUMN achievement_id SET DEFAULT nextval('public.achievements_achievement_id_seq'::regclass);


--
-- TOC entry 4723 (class 2604 OID 16867)
-- Name: audit_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log ALTER COLUMN log_id SET DEFAULT nextval('public.audit_log_log_id_seq'::regclass);


--
-- TOC entry 4730 (class 2604 OID 17047)
-- Name: contact_submissions submission_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_submissions ALTER COLUMN submission_id SET DEFAULT nextval('public.contact_submissions_submission_id_seq'::regclass);


--
-- TOC entry 4720 (class 2604 OID 16779)
-- Name: developers dev_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers ALTER COLUMN dev_id SET DEFAULT nextval('public.developers_dev_id_seq'::regclass);


--
-- TOC entry 4715 (class 2604 OID 16740)
-- Name: game game_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game ALTER COLUMN game_id SET DEFAULT nextval('public.game_game_id_seq'::regclass);


--
-- TOC entry 4714 (class 2604 OID 16733)
-- Name: license lic_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.license ALTER COLUMN lic_id SET DEFAULT nextval('public.license_lic_id_seq'::regclass);


--
-- TOC entry 4721 (class 2604 OID 16848)
-- Name: purchase_log purchase_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_log ALTER COLUMN purchase_id SET DEFAULT nextval('public.purchase_log_purchase_id_seq'::regclass);


--
-- TOC entry 4718 (class 2604 OID 16748)
-- Name: review review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review ALTER COLUMN review_id SET DEFAULT nextval('public.review_review_id_seq'::regclass);


--
-- TOC entry 4725 (class 2604 OID 16928)
-- Name: scores score_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scores ALTER COLUMN score_id SET DEFAULT nextval('public.scores_score_id_seq'::regclass);


--
-- TOC entry 4710 (class 2604 OID 16724)
-- Name: user user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN user_id SET DEFAULT nextval('public.user_user_id_seq'::regclass);


--
-- TOC entry 4719 (class 2604 OID 16767)
-- Name: user_list list_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_list ALTER COLUMN list_id SET DEFAULT nextval('public.user_list_list_id_seq'::regclass);


--
-- TOC entry 4959 (class 0 OID 16944)
-- Dependencies: 238
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.achievements (achievement_id, achievement_name, description, icon_name) FROM stdin;
1	First Purchase	Buy your first game license from the catalog.	Trophy
2	Game Collector	Own 5 or more games.	Trophy
3	Community Voice	Write your first review for any game.	Trophy
4	Top Scorer	Achieve a score of 5000 or more in any game.	Trophy
5	Explorer	Log in on 3 different days.	Trophy
\.


--
-- TOC entry 4955 (class 0 OID 16864)
-- Dependencies: 234
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (log_id, table_name, operation_type, old_data, new_data, changed_by, changed_at) FROM stdin;
1	game	INSERT	\N	{"genre": "asdfhjk;eeiueefddvhb", "title": "sample", "rating": 8.0, "game_id": 16}	postgres	2025-10-18 22:19:01.818488+05:30
2	game	UPDATE	{"genre": "asdfhjk;eeiueefddvhb", "title": "sample", "rating": 8.0, "game_id": 16}	{"genre": "damnnnnn", "title": "sample", "rating": 8.0, "game_id": 16}	postgres	2025-10-18 22:19:26.793681+05:30
3	game	DELETE	{"genre": "damnnnnn", "title": "sample", "rating": 8.0, "game_id": 16}	\N	postgres	2025-10-18 22:19:35.693449+05:30
4	game	UPDATE	{"genre": "Action-adventure", "price": 49.99, "title": "Assassin's Creed Valhalla", "rating": 8.1, "game_id": 5, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action-adventure", "price": 49.99, "title": "Assassin's Creed Valhalla", "rating": 8.1, "game_id": 5, "image_url": "https://upload.wikimedia.org/wikipedia/en/f/ff/Assassin%27s_Creed_Valhalla_cover.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 15:53:36.253738+05:30
5	game	UPDATE	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": "https://en.wikipedia.org/wiki/Batman:_Arkham_Knight#/media/File:Batman_Arkham_Knight_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 15:56:24.59499+05:30
6	game	UPDATE	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": "https://en.wikipedia.org/wiki/Batman:_Arkham_Knight#/media/File:Batman_Arkham_Knight_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": "https://en.wikipedia.org/wiki/Batman:_Arkham_Knight#/media/File:Batman_Arkham_Knight_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 15:57:20.547092+05:30
7	game	UPDATE	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": "https://en.wikipedia.org/wiki/Batman:_Arkham_Knight#/media/File:Batman_Arkham_Knight_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": "https://en.wikipedia.org/wiki/Batman:_Arkham_Knight#/media/File:Batman_Arkham_Knight_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 15:58:17.535111+05:30
8	game	UPDATE	{"genre": "Action RPG", "price": 49.99, "title": "Elden Ring", "rating": 9.6, "game_id": 1, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action RPG", "price": 49.99, "title": "Elden Ring", "rating": 9.6, "game_id": 1, "image_url": "https://en.wikipedia.org/wiki/Elden_Ring#/media/File:Elden_Ring_Box_art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 15:59:32.999692+05:30
9	game	UPDATE	{"genre": "Action RPG", "price": 49.99, "title": "Elden Ring", "rating": 9.6, "game_id": 1, "image_url": "https://en.wikipedia.org/wiki/Elden_Ring#/media/File:Elden_Ring_Box_art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action RPG", "price": 49.99, "title": "Elden Ring", "rating": 9.6, "game_id": 1, "image_url": "https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:01:30.117652+05:30
10	game	UPDATE	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": "https://en.wikipedia.org/wiki/Batman:_Arkham_Knight#/media/File:Batman_Arkham_Knight_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action-adventure", "price": 49.99, "title": "Batman: Arkham Knight", "rating": 8.6, "game_id": 15, "image_url": "https://upload.wikimedia.org/wikipedia/en/6/6c/Batman_Arkham_Knight_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:02:34.49739+05:30
11	game	UPDATE	{"genre": "Shooter", "price": 49.99, "title": "Call of Duty: Modern Warfare (2019)", "rating": 8.2, "game_id": 4, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Shooter", "price": 49.99, "title": "Call of Duty: Modern Warfare (2019)", "rating": 8.2, "game_id": 4, "image_url": "https://upload.wikimedia.org/wikipedia/en/1/1f/Call_of_Duty_Modern_Warfare_%282019%29_cover.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:04:04.380986+05:30
12	game	UPDATE	{"genre": "Sports", "price": 49.99, "title": "FIFA 22", "rating": 7.5, "game_id": 13, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Sports", "price": 49.99, "title": "FIFA 22", "rating": 7.5, "game_id": 13, "image_url": "https://www.google.com/url?sa=i&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FFIFA_22&psig=AOvVaw0Ulxq0N1Gh1vWsrAP8tfjq&ust=1761561278709000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCLCC2KXVwZADFQAAAAAdAAAAABAE", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:05:28.137354+05:30
13	game	UPDATE	{"genre": "Sports", "price": 49.99, "title": "FIFA 22", "rating": 7.5, "game_id": 13, "image_url": "https://www.google.com/url?sa=i&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FFIFA_22&psig=AOvVaw0Ulxq0N1Gh1vWsrAP8tfjq&ust=1761561278709000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCLCC2KXVwZADFQAAAAAdAAAAABAE", "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Sports", "price": 49.99, "title": "FIFA 22", "rating": 7.5, "game_id": 13, "image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/FIFA_22_Cover.jpg/250px-FIFA_22_Cover.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:06:03.073791+05:30
14	game	UPDATE	{"genre": "Action RPG / Open-world", "price": 49.99, "title": "Genshin Impact", "rating": 8.5, "game_id": 2, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action RPG / Open-world", "price": 49.99, "title": "Genshin Impact", "rating": 8.5, "game_id": 2, "image_url": "https://image.api.playstation.com/vulcan/ap/rnd/202508/2602/30935168a0f21b6710dc2bd7bb37c23ed937fb9fa747d84c.png", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:29:59.958383+05:30
15	game	UPDATE	{"genre": "Action-adventure / Open-world", "price": 49.99, "title": "Grand Theft Auto V", "rating": 9.5, "game_id": 3, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Action-adventure / Open-world", "price": 49.99, "title": "Grand Theft Auto V", "rating": 9.5, "game_id": 3, "image_url": "https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:31:12.851605+05:30
16	game	UPDATE	{"genre": "Platformer", "price": 49.99, "title": "Super Mario Odyssey", "rating": 9.0, "game_id": 6, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Platformer", "price": 49.99, "title": "Super Mario Odyssey", "rating": 9.0, "game_id": 6, "image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Super_Mario_Odyssey.jpg/250px-Super_Mario_Odyssey.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:32:39.030801+05:30
17	game	UPDATE	{"genre": "RPG", "price": 49.99, "title": "The Witcher 3: Wild Hunt", "rating": 9.7, "game_id": 7, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "RPG", "price": 49.99, "title": "The Witcher 3: Wild Hunt", "rating": 9.7, "game_id": 7, "image_url": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Witcher_3_cover_art.jpg/250px-Witcher_3_cover_art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:37:47.707763+05:30
18	game	UPDATE	{"genre": "Open-world RPG", "price": 49.99, "title": "The Elder Scrolls V: Skyrim", "rating": 9.4, "game_id": 8, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Open-world RPG", "price": 49.99, "title": "The Elder Scrolls V: Skyrim", "rating": 9.4, "game_id": 8, "image_url": "https://assets-prd.ignimgs.com/2021/08/19/elder-scrolls-skyrim-button-2017-1629409446732.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:39:22.3937+05:30
19	game	UPDATE	{"genre": "FPS (VR)", "price": 49.99, "title": "Half-Life: Alyx", "rating": 9.2, "game_id": 9, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "FPS (VR)", "price": 49.99, "title": "Half-Life: Alyx", "rating": 9.2, "game_id": 9, "image_url": "https://upload.wikimedia.org/wikipedia/en/4/49/Half-Life_Alyx_Cover_Art.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:41:00.700962+05:30
20	game	UPDATE	{"genre": "Battle Royale / Sandbox", "price": 49.99, "title": "Fortnite", "rating": 7.8, "game_id": 10, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Battle Royale / Sandbox", "price": 49.99, "title": "Fortnite", "rating": 7.8, "game_id": 10, "image_url": "https://i.ytimg.com/vi/adGdyCdvKz4/maxresdefault.jpg", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:42:05.58639+05:30
21	game	UPDATE	{"genre": "JRPG", "price": 49.99, "title": "Final Fantasy VII Remake", "rating": 9.3, "game_id": 11, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "JRPG", "price": 49.99, "title": "Final Fantasy VII Remake", "rating": 9.3, "game_id": 11, "image_url": "https://upload.wikimedia.org/wikipedia/en/c/ce/FFVIIRemake.png", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:42:56.033615+05:30
22	game	UPDATE	{"genre": "Fighting", "price": 49.99, "title": "Street Fighter V", "rating": 8.0, "game_id": 12, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "Fighting", "price": 49.99, "title": "Street Fighter V", "rating": 8.0, "game_id": 12, "image_url": "https://upload.wikimedia.org/wikipedia/en/8/80/Street_Fighter_V_box_artwork.png", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:43:37.269218+05:30
23	game	UPDATE	{"genre": "MMORPG", "price": 49.99, "title": "World of Warcraft", "rating": 8.7, "game_id": 14, "image_url": null, "created_at": "2025-10-18T22:23:15.782692+05:30"}	{"genre": "MMORPG", "price": 49.99, "title": "World of Warcraft", "rating": 8.7, "game_id": 14, "image_url": "https://upload.wikimedia.org/wikipedia/en/6/65/World_of_Warcraft.png", "created_at": "2025-10-18T22:23:15.782692+05:30"}	postgres	2025-10-26 16:44:19.912188+05:30
24	game	INSERT	\N	{"genre": "sample", "price": 98.00, "title": "demo", "rating": 7.0, "game_id": 17, "image_url": null, "created_at": "2025-10-26T17:01:33.4456+05:30"}	postgres	2025-10-26 17:01:33.4456+05:30
25	game	DELETE	{"genre": "sample", "price": 98.00, "title": "demo", "rating": 7.0, "game_id": 17, "image_url": null, "created_at": "2025-10-26T17:01:33.4456+05:30"}	\N	postgres	2025-10-26 17:02:15.671908+05:30
\.


--
-- TOC entry 4949 (class 0 OID 16797)
-- Dependencies: 228
-- Data for Name: belong_to; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.belong_to (lic_id, game_id) FROM stdin;
1	1
2	2
3	3
4	4
5	5
6	6
7	7
8	8
9	9
10	10
11	11
12	12
13	13
14	14
15	15
16	1
17	15
18	5
19	1
20	5
21	1
22	7
23	5
24	15
25	1
26	15
27	3
28	1
29	8
30	10
31	15
32	1
33	4
\.


--
-- TOC entry 4963 (class 0 OID 17044)
-- Dependencies: 242
-- Data for Name: contact_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_submissions (submission_id, name, email, subject, message, received_at) FROM stdin;
1	Maheshwari	mahesh@gmail.com	demo	jsdsji chdjd cdnuDC cnsajxdaidx 	2025-10-29 23:49:26.704635+05:30
2	nisarg	nisarg@gmail.com	demo	hii	2025-10-30 14:37:12.191875+05:30
\.


--
-- TOC entry 4947 (class 0 OID 16776)
-- Dependencies: 226
-- Data for Name: developers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.developers (dev_id, dev_name, dev_loc, revenue, fight_complexity, combat_style, lore_depth, gp_type, mp_mode, pvp) FROM stdin;
1	FromSoftware	Kawasaki, Japan	120000000.00	High	Timing-based	Very deep	\N	Online	Yes
2	HoYoverse (miHoYo)	Shanghai, China	90000000.00	Medium	Action RPG	Moderate	Gacha	Co-op	No
3	Rockstar North	Edinburgh, UK	300000000.00	Medium	Open-world	Deep	\N	Online	Yes
4	Activision	Santa Monica, USA	250000000.00	Low	Shooter	Low	\N	Multiplayer	Yes
5	Ubisoft	Montreuil, France	180000000.00	Medium	Stealth/Action	Moderate	\N	Co-op	Yes
6	Nintendo	Kyoto, Japan	220000000.00	Low	Platformer	Low	\N	Single-player	No
7	CD Projekt Red	Warsaw, Poland	80000000.00	Medium	RPG	Very deep	\N	Online	No
8	Bethesda Game Studios	Rockville, USA	150000000.00	Medium	Open-world	Deep	\N	Single-player	No
9	Valve Corporation	Bellevue, USA	200000000.00	Low	Shooter/Strategy	Moderate	\N	Multiplayer	Yes
10	Epic Games	Cary, USA	170000000.00	Low	Battle Royale	Low	\N	Online	Yes
11	Square Enix	Tokyo, Japan	110000000.00	Medium	JRPG	Deep	\N	Single-player	No
12	Capcom	Osaka, Japan	95000000.00	High	Fighting	Low	\N	Online	Yes
13	Electronic Arts (EA)	Redwood City, USA	210000000.00	Low	Sports	Low	\N	Multiplayer	Yes
14	Blizzard Entertainment	Irvine, USA	160000000.00	Medium	MMORPG	Deep	\N	Online	Yes
15	Rocksteady Studios	London, UK	50000000.00	High	Combat-heavy	Moderate	\N	Single-player	No
\.


--
-- TOC entry 4961 (class 0 OID 16969)
-- Dependencies: 240
-- Data for Name: friends; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friends (user_one_id, user_two_id, status, action_user_id) FROM stdin;
1	2	accepted	1
3	4	pending	3
5	6	accepted	5
5	7	pending	5
1	22	pending	22
1	20	accepted	20
2	20	accepted	20
1	21	accepted	21
17	21	accepted	21
19	21	accepted	21
20	21	accepted	21
2	25	pending	25
5	25	pending	25
15	25	pending	25
18	24	pending	24
23	24	pending	24
24	25	pending	24
16	25	pending	25
25	26	pending	26
22	26	pending	26
23	26	pending	26
18	26	pending	26
19	26	accepted	19
19	24	accepted	19
27	28	pending	28
25	28	pending	28
26	28	pending	28
21	28	accepted	21
\.


--
-- TOC entry 4941 (class 0 OID 16737)
-- Dependencies: 220
-- Data for Name: game; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.game (game_id, title, genre, rating, created_at, price, image_url) FROM stdin;
5	Assassin's Creed Valhalla	Action-adventure	8.1	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/f/ff/Assassin%27s_Creed_Valhalla_cover.jpg
1	Elden Ring	Action RPG	9.6	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/b/b9/Elden_Ring_Box_art.jpg
15	Batman: Arkham Knight	Action-adventure	8.6	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/6/6c/Batman_Arkham_Knight_Cover_Art.jpg
4	Call of Duty: Modern Warfare (2019)	Shooter	8.2	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/1/1f/Call_of_Duty_Modern_Warfare_%282019%29_cover.jpg
13	FIFA 22	Sports	7.5	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/FIFA_22_Cover.jpg/250px-FIFA_22_Cover.jpg
2	Genshin Impact	Action RPG / Open-world	8.5	2025-10-18 22:23:15.782692+05:30	49.99	https://image.api.playstation.com/vulcan/ap/rnd/202508/2602/30935168a0f21b6710dc2bd7bb37c23ed937fb9fa747d84c.png
3	Grand Theft Auto V	Action-adventure / Open-world	9.5	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png
6	Super Mario Odyssey	Platformer	9.0	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Super_Mario_Odyssey.jpg/250px-Super_Mario_Odyssey.jpg
7	The Witcher 3: Wild Hunt	RPG	9.7	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Witcher_3_cover_art.jpg/250px-Witcher_3_cover_art.jpg
8	The Elder Scrolls V: Skyrim	Open-world RPG	9.4	2025-10-18 22:23:15.782692+05:30	49.99	https://assets-prd.ignimgs.com/2021/08/19/elder-scrolls-skyrim-button-2017-1629409446732.jpg
9	Half-Life: Alyx	FPS (VR)	9.2	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/4/49/Half-Life_Alyx_Cover_Art.jpg
10	Fortnite	Battle Royale / Sandbox	7.8	2025-10-18 22:23:15.782692+05:30	49.99	https://i.ytimg.com/vi/adGdyCdvKz4/maxresdefault.jpg
11	Final Fantasy VII Remake	JRPG	9.3	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/c/ce/FFVIIRemake.png
12	Street Fighter V	Fighting	8.0	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/8/80/Street_Fighter_V_box_artwork.png
14	World of Warcraft	MMORPG	8.7	2025-10-18 22:23:15.782692+05:30	49.99	https://upload.wikimedia.org/wikipedia/en/6/65/World_of_Warcraft.png
\.


--
-- TOC entry 4939 (class 0 OID 16730)
-- Dependencies: 218
-- Data for Name: license; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.license (lic_id, price, validity, date_of_purchase) FROM stdin;
1	59.99	1 year	2023-05-15
2	0.00	00:00:00	2024-01-10
3	49.99	6 mons	2023-11-20
4	29.99	1 year	2024-02-25
5	39.99	6 mons	2023-07-01
6	59.99	1 year	2024-08-01
7	19.99	3 mons	2023-12-12
8	0.00	00:00:00	2024-03-03
9	14.99	1 mon	2024-05-05
10	0.00	00:00:00	2018-10-01
11	69.99	1 year	2024-06-06
12	49.99	6 mons	2024-07-15
13	24.99	3 mons	2024-04-04
14	9.99	1 mon	2023-08-20
15	39.99	6 mons	2024-09-01
16	49.99	1 year	2025-10-18
17	49.99	1 year	2025-10-18
18	49.99	1 year	2025-10-18
19	49.99	1 year	2025-10-18
20	49.99	1 year	2025-10-26
21	49.99	1 year	2025-10-26
22	49.99	1 year	2025-10-26
23	49.99	1 year	2025-10-26
24	49.99	1 year	2025-10-26
25	49.99	1 year	2025-10-26
26	49.99	1 year	2025-10-29
27	49.99	1 year	2025-10-29
28	49.99	1 year	2025-10-29
29	49.99	1 year	2025-10-29
30	49.99	1 year	2025-10-29
31	49.99	1 year	2025-10-29
32	49.99	1 year	2025-10-29
33	49.99	1 year	2025-10-30
\.


--
-- TOC entry 4948 (class 0 OID 16782)
-- Dependencies: 227
-- Data for Name: owns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.owns (user_id, lic_id) FROM stdin;
1	1
2	2
3	3
4	4
5	5
6	6
7	7
8	8
9	9
10	10
11	11
12	12
13	13
14	14
15	15
20	16
20	17
23	18
23	19
21	20
21	21
21	22
25	23
25	24
25	25
26	26
26	27
26	28
26	29
26	30
26	31
27	32
28	33
\.


--
-- TOC entry 4953 (class 0 OID 16845)
-- Dependencies: 232
-- Data for Name: purchase_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_log (purchase_id, user_id, game_id, price_paid, purchase_date) FROM stdin;
\.


--
-- TOC entry 4943 (class 0 OID 16745)
-- Dependencies: 222
-- Data for Name: review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.review (review_id, game_id, user_id, user_exp, feedback, recommendations) FROM stdin;
1	1	1	Extremely challenging, rewarding	Open world and boss design are top-tier	More quality-of-life features for weapon swapping
2	2	5	Gorgeous visuals & free-to-play	Gacha mechanics can be grindy	Slightly better pity rates
3	3	9	Massive map and countless activities	Long loading times on older consoles	Improve launcher optimization
4	4	2	Fast-paced and cinematic	Occasional netcode issues	Add regional matchmaking fixes
6	6	4	Joyful and inventive platforming	Camera occasionally awkward	Improve camera behavior in tight spaces
7	7	11	Deep narrative and choices	Some late-game bugs	Provide longer-term support patches
8	8	8	Endless mods and freedom	Aging graphics in places	Official mod tools update
9	9	7	Immersive VR experience	High hardware requirements	Optimize CPU bottlenecks
10	10	12	Fun with friends and cross-play	Microtransaction balance concerns	Clearer monetization options
11	11	6	Nostalgic combat and style	Some pacing issues vs original	Add optional classic mode
12	12	10	Technical fighting game	Matchmaking sometimes imbalanced	Refine rank algorithms
13	13	3	Good sports simulation	AI defenders sometimes odd	Add deeper career options
14	14	13	Huge MMO with strong community	Subscription and expansions expensive	Occasional free weekends help retention
15	15	15	Strong combat and atmosphere	PC performance hits on some rigs	Patch GPU bottlenecks
5	5	14	Great story and exploration	Some repetitive missions	Add more settlement management
17	9	27	demo	demo	no
\.


--
-- TOC entry 4950 (class 0 OID 16812)
-- Dependencies: 229
-- Data for Name: rights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rights (dev_id, game_id) FROM stdin;
1	1
2	2
3	3
4	4
5	5
6	6
7	7
8	8
9	9
10	10
11	11
12	12
13	13
14	14
15	15
\.


--
-- TOC entry 4957 (class 0 OID 16925)
-- Dependencies: 236
-- Data for Name: scores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scores (score_id, user_id, game_id, score, achieved_at) FROM stdin;
1	1	1	1500	2025-10-18 21:09:29.476654+05:30
2	2	1	2200	2025-10-18 21:09:29.476654+05:30
3	3	1	1800	2025-10-18 21:09:29.476654+05:30
4	4	3	3000	2025-10-18 21:09:29.476654+05:30
5	5	3	2800	2025-10-18 21:09:29.476654+05:30
6	1	7	5000	2025-10-18 21:09:29.476654+05:30
7	7	7	5500	2025-10-18 21:09:29.476654+05:30
8	8	7	4800	2025-10-18 21:09:29.476654+05:30
9	2	5	1200	2025-10-18 21:09:29.476654+05:30
10	10	5	1350	2025-10-18 21:09:29.476654+05:30
\.


--
-- TOC entry 4937 (class 0 OID 16721)
-- Dependencies: 216
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (user_id, f_name, l_name, date_of_join, email, wallet_balance, password_hash, role) FROM stdin;
1	Aarav	Shah	2022-11-03	aarav.shah@example.com	100.00	temporary_password	user
2	Meera	Patel	2023-01-20	meera.patel@example.com	100.00	temporary_password	user
3	Rohan	Kumar	2023-03-15	rohan.kumar@example.com	100.00	temporary_password	user
4	Ananya	Gupta	2023-05-10	ananya.gupta@example.com	100.00	temporary_password	user
5	David	Brown	2023-07-22	david.brown@example.com	100.00	temporary_password	user
6	Sofia	Martinez	2024-01-05	sofia.martinez@example.com	100.00	temporary_password	user
7	Liam	Wilson	2024-02-11	liam.wilson@example.com	100.00	temporary_password	user
8	Emma	Johnson	2024-03-03	emma.johnson@example.com	100.00	temporary_password	user
9	Noah	Lee	2024-04-09	noah.lee@example.com	100.00	temporary_password	user
10	Olivia	Garcia	2024-05-17	olivia.garcia@example.com	100.00	temporary_password	user
11	Lucas	Anderson	2024-06-01	lucas.anderson@example.com	100.00	temporary_password	user
12	Mia	Thomas	2024-06-30	mia.thomas@example.com	100.00	temporary_password	user
13	Ethan	Clark	2024-07-19	ethan.clark@example.com	100.00	temporary_password	user
14	Ava	Lewis	2024-08-02	ava.lewis@example.com	100.00	temporary_password	user
15	Zoe	Walker	2024-09-01	zoe.walker@example.com	100.00	temporary_password	user
16	Manu	Jadhav	2025-10-14	manu.jadhav07@gmail.com	100.00	temporary_password	user
17	Yash	Govekar	2025-10-14	yash.govekar@gmail.com	100.00	temporary_password	user
18	Durgesh	Dere	2025-10-15	durgesh.dere@gmail.com	100.00	temporary_password	user
19	priya_patil	User	2025-10-15	priya.patil@gmail.com	100.00	$2b$10$2xa0iQGlbAtDj9UEmx0jtOAB54hKUCdJTbKyF1DzVKw7ZUMOoNQh.	user
22	Jiya_Jadhav	User	2025-10-18	jiya.jadhav@gmail.com	100.00	$2b$10$XM.Fs3FEr4mWXkzUBhKfo.w86Ra.zyJJF9pmb1lDxFAPFQAYHjWWe	user
23	Harsh	User	2025-10-18	harsh.admin@gmail.com	550.01	$2b$10$XYrJpCyJpiH7Hrc5osnK8OGapB.Ori3FoMPae6RuCNvBHZqZCPx7G	admin
20	admin_mansi	User	2025-10-15	mansi.admin@gmail.com	400.00	$2b$10$86eHfMbGsibIU/BoiNEEReXJw0JBTbhCRNcdtsBvYHNVsNj6sdwhu	user
24	manu	Admin	2025-10-26	manu.admin@gmail.com	100.00	$2b$10$wou5ar6KarbTuoaTwDyrueQX4H.AKG0L/m2gFtOlIA19eEOBY7a3e	admin
21	sejal_dhanve	User	2025-10-16	sejal.dhanve@gmail.com	450.03	$2b$10$pD1H79IzcpFfJQ9goOE9hOZMVxuuJA6BCGAYPjUvkDzfVfvSN.Nh2	user
25	sakshi_patil	User	2025-10-26	sakshi.patil@gmail.com	450.03	$2b$10$GrmGIcmoIt1TmtNudLYiYOOvVM48g.ZHOjhxb512pSvAY2.rpvq8K	user
26	maheshwari	User	2025-10-29	mahesh@gmail.com	0.04	$2b$10$qnvMZlFv.TneLoyVchZR3OL1zl/7xw4Sz1JQqZ.tFLiF/w21BQd/K	user
27	tanya_jha	User	2025-10-29	tanya@gmail.com	50.01	$2b$10$pNuLM3US5f.w2/LSrlT12.PHg40mj7EqS64dWkEs7KKdHx8vr8jRq	user
28	nisarg29	User	2025-10-30	nisarg@gmail.com	250.01	$2b$10$vtZ7iedaz/RHa052Seeo5eu/kYWRdM5S0raMk8FG3AE5tdAoy4P6.	user
\.


--
-- TOC entry 4960 (class 0 OID 16953)
-- Dependencies: 239
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_achievements (user_id, achievement_id, unlocked_at) FROM stdin;
1	1	2025-10-18 21:18:13.432951+05:30
2	1	2025-10-18 21:18:13.432951+05:30
1	3	2025-10-18 21:18:13.432951+05:30
5	1	2025-10-18 21:18:13.432951+05:30
7	4	2025-10-18 21:18:13.432951+05:30
27	1	2025-10-29 23:12:34.919877+05:30
27	3	2025-10-29 23:13:10.557895+05:30
28	3	2025-10-30 14:34:46.088144+05:30
28	1	2025-10-30 14:36:11.138702+05:30
\.


--
-- TOC entry 4945 (class 0 OID 16764)
-- Dependencies: 224
-- Data for Name: user_list; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_list (list_id, user_id, no_of_games) FROM stdin;
1	1	3
2	2	2
3	3	4
4	4	1
5	5	5
6	6	2
7	7	3
8	8	2
9	9	4
10	10	1
11	11	2
12	12	3
13	13	4
14	14	2
15	15	3
16	20	3
17	25	3
18	26	1
19	28	1
\.


--
-- TOC entry 4951 (class 0 OID 16827)
-- Dependencies: 230
-- Data for Name: wishlist_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wishlist_items (list_id, game_id) FROM stdin;
1	1
1	3
1	7
2	2
2	5
2	9
3	4
3	6
3	10
4	6
5	2
5	1
5	10
5	14
5	3
6	8
6	11
7	12
7	13
7	15
16	15
16	5
16	4
17	4
17	5
17	15
18	15
19	4
\.


--
-- TOC entry 4980 (class 0 OID 0)
-- Dependencies: 237
-- Name: achievements_achievement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.achievements_achievement_id_seq', 5, true);


--
-- TOC entry 4981 (class 0 OID 0)
-- Dependencies: 233
-- Name: audit_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_log_log_id_seq', 25, true);


--
-- TOC entry 4982 (class 0 OID 0)
-- Dependencies: 241
-- Name: contact_submissions_submission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.contact_submissions_submission_id_seq', 2, true);


--
-- TOC entry 4983 (class 0 OID 0)
-- Dependencies: 225
-- Name: developers_dev_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.developers_dev_id_seq', 1, false);


--
-- TOC entry 4984 (class 0 OID 0)
-- Dependencies: 219
-- Name: game_game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.game_game_id_seq', 17, true);


--
-- TOC entry 4985 (class 0 OID 0)
-- Dependencies: 217
-- Name: license_lic_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.license_lic_id_seq', 33, true);


--
-- TOC entry 4986 (class 0 OID 0)
-- Dependencies: 231
-- Name: purchase_log_purchase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_log_purchase_id_seq', 1, false);


--
-- TOC entry 4987 (class 0 OID 0)
-- Dependencies: 221
-- Name: review_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.review_review_id_seq', 18, true);


--
-- TOC entry 4988 (class 0 OID 0)
-- Dependencies: 235
-- Name: scores_score_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scores_score_id_seq', 10, true);


--
-- TOC entry 4989 (class 0 OID 0)
-- Dependencies: 223
-- Name: user_list_list_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_list_list_id_seq', 19, true);


--
-- TOC entry 4990 (class 0 OID 0)
-- Dependencies: 215
-- Name: user_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_user_id_seq', 28, true);


--
-- TOC entry 4765 (class 2606 OID 16952)
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (achievement_id);


--
-- TOC entry 4760 (class 2606 OID 16872)
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (log_id);


--
-- TOC entry 4752 (class 2606 OID 16801)
-- Name: belong_to belong_to_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.belong_to
    ADD CONSTRAINT belong_to_pkey PRIMARY KEY (lic_id, game_id);


--
-- TOC entry 4771 (class 2606 OID 17052)
-- Name: contact_submissions contact_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_submissions
    ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (submission_id);


--
-- TOC entry 4748 (class 2606 OID 16781)
-- Name: developers developers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.developers
    ADD CONSTRAINT developers_pkey PRIMARY KEY (dev_id);


--
-- TOC entry 4769 (class 2606 OID 16975)
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (user_one_id, user_two_id);


--
-- TOC entry 4742 (class 2606 OID 16743)
-- Name: game game_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.game
    ADD CONSTRAINT game_pkey PRIMARY KEY (game_id);


--
-- TOC entry 4740 (class 2606 OID 16735)
-- Name: license license_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.license
    ADD CONSTRAINT license_pkey PRIMARY KEY (lic_id);


--
-- TOC entry 4750 (class 2606 OID 16786)
-- Name: owns owns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owns
    ADD CONSTRAINT owns_pkey PRIMARY KEY (user_id, lic_id);


--
-- TOC entry 4758 (class 2606 OID 16851)
-- Name: purchase_log purchase_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_log
    ADD CONSTRAINT purchase_log_pkey PRIMARY KEY (purchase_id);


--
-- TOC entry 4744 (class 2606 OID 16752)
-- Name: review review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_pkey PRIMARY KEY (review_id);


--
-- TOC entry 4754 (class 2606 OID 16816)
-- Name: rights rights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_pkey PRIMARY KEY (dev_id, game_id);


--
-- TOC entry 4763 (class 2606 OID 16931)
-- Name: scores scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_pkey PRIMARY KEY (score_id);


--
-- TOC entry 4767 (class 2606 OID 16958)
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (user_id, achievement_id);


--
-- TOC entry 4736 (class 2606 OID 16728)
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- TOC entry 4746 (class 2606 OID 16769)
-- Name: user_list user_list_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_list
    ADD CONSTRAINT user_list_pkey PRIMARY KEY (list_id);


--
-- TOC entry 4738 (class 2606 OID 16726)
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4756 (class 2606 OID 16831)
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (list_id, game_id);


--
-- TOC entry 4761 (class 1259 OID 16942)
-- Name: idx_scores_on_game_and_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scores_on_game_and_score ON public.scores USING btree (game_id, score DESC);


--
-- TOC entry 4792 (class 2620 OID 16874)
-- Name: game game_audit_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER game_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON public.game FOR EACH ROW EXECUTE FUNCTION public.log_game_changes();


--
-- TOC entry 4777 (class 2606 OID 16807)
-- Name: belong_to belong_to_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.belong_to
    ADD CONSTRAINT belong_to_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(game_id) ON DELETE CASCADE;


--
-- TOC entry 4778 (class 2606 OID 16802)
-- Name: belong_to belong_to_lic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.belong_to
    ADD CONSTRAINT belong_to_lic_id_fkey FOREIGN KEY (lic_id) REFERENCES public.license(lic_id) ON DELETE CASCADE;


--
-- TOC entry 4789 (class 2606 OID 16986)
-- Name: friends friends_action_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_action_user_id_fkey FOREIGN KEY (action_user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 4790 (class 2606 OID 16976)
-- Name: friends friends_user_one_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user_one_id_fkey FOREIGN KEY (user_one_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 4791 (class 2606 OID 16981)
-- Name: friends friends_user_two_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user_two_id_fkey FOREIGN KEY (user_two_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 4775 (class 2606 OID 16792)
-- Name: owns owns_lic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owns
    ADD CONSTRAINT owns_lic_id_fkey FOREIGN KEY (lic_id) REFERENCES public.license(lic_id) ON DELETE CASCADE;


--
-- TOC entry 4776 (class 2606 OID 16787)
-- Name: owns owns_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owns
    ADD CONSTRAINT owns_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 4783 (class 2606 OID 16857)
-- Name: purchase_log purchase_log_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_log
    ADD CONSTRAINT purchase_log_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(game_id);


--
-- TOC entry 4784 (class 2606 OID 16852)
-- Name: purchase_log purchase_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_log
    ADD CONSTRAINT purchase_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id);


--
-- TOC entry 4772 (class 2606 OID 16753)
-- Name: review review_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(game_id) ON DELETE CASCADE;


--
-- TOC entry 4773 (class 2606 OID 16758)
-- Name: review review_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.review
    ADD CONSTRAINT review_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE SET NULL;


--
-- TOC entry 4779 (class 2606 OID 16817)
-- Name: rights rights_dev_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_dev_id_fkey FOREIGN KEY (dev_id) REFERENCES public.developers(dev_id) ON DELETE CASCADE;


--
-- TOC entry 4780 (class 2606 OID 16822)
-- Name: rights rights_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rights
    ADD CONSTRAINT rights_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(game_id) ON DELETE CASCADE;


--
-- TOC entry 4785 (class 2606 OID 16937)
-- Name: scores scores_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(game_id) ON DELETE CASCADE;


--
-- TOC entry 4786 (class 2606 OID 16932)
-- Name: scores scores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 4787 (class 2606 OID 16964)
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(achievement_id) ON DELETE CASCADE;


--
-- TOC entry 4788 (class 2606 OID 16959)
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 4774 (class 2606 OID 16770)
-- Name: user_list user_list_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_list
    ADD CONSTRAINT user_list_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE CASCADE;


--
-- TOC entry 4781 (class 2606 OID 16837)
-- Name: wishlist_items wishlist_items_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.game(game_id) ON DELETE CASCADE;


--
-- TOC entry 4782 (class 2606 OID 16832)
-- Name: wishlist_items wishlist_items_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT wishlist_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES public.user_list(list_id) ON DELETE CASCADE;


-- Completed on 2025-10-30 14:49:46

--
-- PostgreSQL database dump complete
--

