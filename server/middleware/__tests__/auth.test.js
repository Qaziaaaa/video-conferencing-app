const jwt = require('jsonwebtoken');
const authMiddleware = require('../auth');

describe('JWT Middleware', () => {
  const JWT_SECRET = 'secret';
  
  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('valid token passes', () => {
    const token = jwt.sign({ userId: '123' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe('123');
  });

  it('expired token returns 401', () => {
    const token = jwt.sign({ userId: '123' }, JWT_SECRET, { expiresIn: '-1s' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token expired' }));
  });

  it('missing token returns 401', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('tampered token returns 401', () => {
    const token = jwt.sign({ userId: '123' }, JWT_SECRET) + 'tampered';
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
