import math

class N:
    __slots__ = ("v",)
    def __init__(self,v):
        if isinstance(v,N):
            self.v = v.v
        else:
            self.v = int(v)
    def __add__(self,o):
        return N(self.v + (o.v if isinstance(o,N) else o))
    def __sub__(self,o):
        return N(self.v - (o.v if isinstance(o,N) else o))
    def __mul__(self,o):
        return N(self.v * (o.v if isinstance(o,N) else o))
    def __pow__(self,p):
        return N(self.v ** (p.v if isinstance(p,N) else p))
    def __mod__(self,m):
        return N(self.v % (m.v if isinstance(m,N) else m))
    def __int__(self):
        return self.v
    def __repr__(self):
        return "<N {}>".format(hex((self.v*2654435761)&0xffffffff))

def generate_password(k):
    k = N(k)
    a = N(2)*k + N(1)
    b = -k
    c = k
    d = k
    e = N(3)*k + N(2)
    f = N(4)*k
    g = -k
    h = N(2)*k
    i = N(5)*k + N(1)

    ei_fh = e*i - f*h
    di_fg = d*i - f*g
    dh_eg = d*h - e*g

    det = a*ei_fh - b*di_fg + c*dh_eg

    integral = N(int(3/4 * 1e6))
    collapse = (k - N(7))**3 * N(1000000)
    offset = N(18)
    scale = N(1395)

    output = det*scale + integral + collapse + offset
    return output
