PROPS = []


def prop(pid, title, category, cutout=False):
    def deco(fn):
        PROPS.append({'id': pid, 'title': title, 'category': category, 'cutout': cutout, 'fn': fn})
        return fn
    return deco
