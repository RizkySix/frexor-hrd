-- CreateTable
CREATE TABLE "RSVPEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "dropdownOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "RSVPEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RSVPResponse" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dropdownValue" TEXT,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RSVPResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RSVPEvent_token_key" ON "RSVPEvent"("token");

-- CreateIndex
CREATE INDEX "RSVPEvent_createdBy_idx" ON "RSVPEvent"("createdBy");

-- CreateIndex
CREATE INDEX "RSVPResponse_eventId_idx" ON "RSVPResponse"("eventId");

-- CreateIndex
CREATE INDEX "RSVPResponse_eventId_name_idx" ON "RSVPResponse"("eventId", "name");

-- AddForeignKey
ALTER TABLE "RSVPEvent" ADD CONSTRAINT "RSVPEvent_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "HRDUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVPResponse" ADD CONSTRAINT "RSVPResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "RSVPEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
