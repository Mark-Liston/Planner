CREATE TABLE IF NOT EXISTS "Unit" (
	"code"	varchar(10) NOT NULL,
	"retrievedOn"	date NOT NULL,
	"data"	text NOT NULL,
	PRIMARY KEY("code","retrievedOn")
);
CREATE TABLE IF NOT EXISTS "Degree" (
	"code"	varchar(10) NOT NULL,
	"retrievedOn"	date NOT NULL,
	"data"	text NOT NULL,
	PRIMARY KEY("code","retrievedOn")
);
CREATE TABLE IF NOT EXISTS "Major" (
	"code"	varchar(10) NOT NULL,
	"retrievedOn"	date NOT NULL,
	"data"	text NOT NULL,
	PRIMARY KEY("code","retrievedOn")
);
CREATE TABLE IF NOT EXISTS "Minor" (
	"code"	varchar(10) NOT NULL,
	"retrievedOn"	date NOT NULL,
	"data"	text NOT NULL,
	PRIMARY KEY("code","retrievedOn")
);
CREATE TABLE IF NOT EXISTS "Co-Major" (
	"code"	varchar(10) NOT NULL,
	"retrievedOn"	date NOT NULL,
	"data"	text NOT NULL,
	PRIMARY KEY("code","retrievedOn")
);
CREATE TABLE IF NOT EXISTS "Rating" (
	"code"	varchar(10) NOT NULL,
	"rating"	int NOT NULL
);
CREATE TABLE IF NOT EXISTS "Users" (
	"email"	TEXT NOT NULL,
	"username"	TEXT NOT NULL,
	"type" VARCHAR(10) NOT NULL,
	"password"	VARCHAR(60) NOT NULL,
	PRIMARY KEY("email")
);
CREATE TABLE IF NOT EXISTS "CoursePlan" (
	"email" TEXT NOT NULL,
	"timeChanged" datetime NOT NULL,
	"changes" text,
	"data" text NOT NULL,
	PRIMARY KEY (email, timeChanged)
);
