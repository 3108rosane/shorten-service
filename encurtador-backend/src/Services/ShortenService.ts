import { Link } from '@prisma/client';
import crypto from 'crypto';
import { customAlphabet } from 'nanoid';
import { prisma } from '../prisma/client';
import QrCode from 'qrcode';

class ShortenService {
    public async register({ url, shortId }: { url: string, shortId: string | null }) {
        if(shortId !== null){
            const shortIdExist = await prisma.link.findUnique({where: {shortId}})
            if(shortIdExist){
                throw new Error("short Id já existe...");
            }
        }


        const generateNanoId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 5)
        const customId = shortId === null ? generateNanoId() : shortId;

        const link = {
            id: crypto.randomUUID(),
            shortId: customId,
            originalUrl: url,
            createdAt: new Date()
        } as Link;

        await prisma.link.create({ data: link });

        return { shortId: link.shortId }
    }

    public async findByIdentifier(identifier: string) {
        const link = await prisma.link.findUnique({ where: { shortId: identifier } });
        if (!link) {
            throw new Error("Not found..")
        }

        return { originalUrl: link.originalUrl }
    }

    public async generateQrCode({ url }: { url: string }) {
        const base64 = await QrCode.toDataURL(url);
        return { base64: base64 };
    }
}

export const shortenService = new ShortenService();