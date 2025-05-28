-- CreateTable
CREATE TABLE "Project" (
    "pId" SERIAL NOT NULL,
    "pName" TEXT NOT NULL,
    "pDateStart" TIMESTAMP(3) NOT NULL,
    "pDateEnd" TIMESTAMP(3) NOT NULL,
    "pDateCompleted" TIMESTAMP(3) NOT NULL,
    "pStatus" TEXT NOT NULL,
    "pDescription" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("pId")
);
