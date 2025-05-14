import { Request, Response, NextFunction } from 'express';

export const authLogger = (req: Request, res: Response, next: NextFunction) => {
    console.log('\n=== Auth Request ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'accept': req.headers['accept']
    });
    console.log('Body:', req.body);
    console.log('=================\n');

    // Capture the response using res.send monkey patch
    const originalSend = res.send;
    res.send = function (body) {
        console.log('\n=== Auth Response ===');
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
        console.log('===================\n');
        return originalSend.call(this, body);
    };

    next();
};
