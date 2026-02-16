class N {
    public v: number;
    constructor(v: number | N) {
        if (v instanceof N) {
            this.v = v.v;
        } else {
            this.v = Math.floor(v);
        }
    }

    add(o: number | N): N {
        return new N(this.v + (o instanceof N ? o.v : o));
    }

    sub(o: number | N): N {
        return new N(this.v - (o instanceof N ? o.v : o));
    }

    mul(o: number | N): N {
        return new N(this.v * (o instanceof N ? o.v : o));
    }

    pow(p: number | N): N {
        return new N(Math.pow(this.v, (p instanceof N ? p.v : p)));
    }

    mod(m: number | N): N {
        return new N(this.v % (m instanceof N ? m.v : m));
    }

    neg(): N {
        return new N(-this.v);
    }

    toInt(): number {
        return this.v;
    }
}

function generate_password(k_val: number): number {
    const k = new N(k_val);
    const a = new N(2).mul(k).add(1);
    const b = k.neg();
    const c = k;
    const d = k;
    const e = new N(3).mul(k).add(2);
    const f = new N(4).mul(k);
    const g = k.neg();
    const h = new N(2).mul(k);
    const i = new N(5).mul(k).add(1);

    const ei_fh = e.mul(i).sub(f.mul(h));
    const di_fg = d.mul(i).sub(f.mul(g));
    const dh_eg = d.mul(h).sub(e.mul(g));

    const det = a.mul(ei_fh).sub(b.mul(di_fg)).add(c.mul(dh_eg));

    const integral = new N(Math.floor((3 / 4) * 1e6));
    const collapse = k.sub(7).pow(3).mul(1000000);
    const offset = new N(18);
    const scale = new N(1395);

    const output = det.mul(scale).add(integral).add(collapse).add(offset);
    return output.toInt();
}

/**
 * Checks if the provided password matches the internally generated admin password.
 * The password is derived from a specific key value and protected through obfuscation.
 */
export function verifyAdminPassword(password: string): boolean {
    // Hidden key value: 7
    const expected = generate_password(7).toString();
    return password === expected;
}

/**
 * Returns the hardcoded admin password.
 * Internal use only.
 */
export function getAdminPassword(): string {
    return generate_password(7).toString();
}
