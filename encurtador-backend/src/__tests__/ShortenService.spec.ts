import { toDataURL } from "qrcode"
import { prisma } from "../prisma/client"
import { shortenService } from "../Services/ShortenService"
import  QRCode from "qrcode"
jest.mock('nanoid', () => {
    return {
        customAlphabet: jest.fn().mockReturnValue(() => 'ABCDE')
    }
})

jest.mock("../prisma/client", () => {
    return {
        prisma: {
            link: {
                create: jest.fn(),
                findUnique: jest.fn()
            }
        }
    }
})
jest.mock('qrcode',()=> {
    return{
        toDataURL:jest.fn()
    }
})

describe("Shorten Service Test", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    it("Deve registar receber uma URL e retornar um shortId", async () => {
        const resultado = await shortenService.register({ url: "www.teste.com/essa-url-e-longa", shortId: null });

        expect(resultado).toHaveProperty('shortId');
        expect(resultado.shortId).toHaveLength(5);
        expect(resultado).toEqual({ shortId: 'ABCDE'})
        expect(prisma.link.create).toHaveBeenCalledTimes(1);
        expect(prisma.link.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                originalUrl: "www.teste.com/essa-url-e-longa",
                shortId: expect.any(String)
            })
        }))
    })

    it("Deve registar receber uma URL e retornar um shortId", async () => {
        const resultado = await shortenService.register({ url: "www.teste.com/essa-url-e-longa", shortId: "teste" });

        expect(resultado).toHaveProperty('shortId');
        expect(resultado).toEqual({ shortId: 'teste'})
        expect(prisma.link.create).toHaveBeenCalledTimes(1);
        expect(prisma.link.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                originalUrl: "www.teste.com/essa-url-e-longa",
                shortId: expect.any(String)
            })
        }))
    })

    it ("deve retornar um erro quando for passado um shortId ja utilizado" , async ()=>{
        const mockShortId= 'teste';
        (prisma.link.findUnique as jest.Mock).mockResolvedValue({
            shortId :mockShortId,
            originalUrl:'www.teste.com'
        })

        await expect(shortenService.register({url:'www.teste.com', shortId: mockShortId}))
         .rejects
         .toThrow('shortId já existe...')
    })

    it("deve buscar um link pelo shortId existente",async () =>{
        const mockShortId = 'test';
        const mockOriginalUrl= 'www.teste.com.br/teste/teste2/teste3';
        (prisma.link.findUnique as jest.Mock) .mockReturnValue({
            shortId: mockShortId,
            originalUrl:mockOriginalUrl,
        });

        const resultado = await shortenService.findByIdentifier('teste');

        expect(resultado).toEqual({orinalUrl:'www.teste.com.br/teste/teste2/teste3' })
        expect(prisma.link.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.link.findUnique).toHaveBeenCalledWith({where:{shortId: 'teste'}})

    })

    it("deve buscar um link pelo shortId existente",async () =>{
        const mockShortId = 'test';
        const mockOriginalUrl= 'www.teste.com.br/teste/teste2/teste3';
        (prisma.link.findUnique as jest.Mock) .mockReturnValue({
            shortId: mockShortId,
            originalUrl:mockOriginalUrl,
        });

        const resultado = await shortenService.findByIdentifier(mockShortId);

        expect(resultado).toEqual({originalUrl:mockOriginalUrl })
        expect(prisma.link.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.link.findUnique).toHaveBeenCalledWith({where:{shortId:mockShortId }})

    })

    it("deve buscar um link pelo shortId inexistente",async () =>{
        const mockShortId = 'test';
        
        (prisma.link.findUnique as jest.Mock) .mockReturnValue(null);

        await expect(shortenService.findByIdentifier(mockShortId))
            .rejects
            .toThrow("Not found..")
        

    })

    it("deve gerar um base64 de um link informado", async () => {
        const mockUrl = "https://exemplo.teste.com";
        const mockBase64 = "data:image/png;base64,exemplo";

        (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockBase64);
        const resultado = await shortenService.generateQrCode({url: mockUrl});

        expect(resultado).toEqual({base64: mockBase64})
        expect(QRCode.toDataURL).toHaveBeenCalledTimes(1);
        expect(QRCode.toDataURL).toHaveBeenCalledWith(mockUrl)
    })

    it("devedar problema porque url é null", async () => {
        await expect(shortenService.generateQrCode({url: null as any }))
        .rejects
        .toThrow("erro ao gerar qrcode")
    })

   
})