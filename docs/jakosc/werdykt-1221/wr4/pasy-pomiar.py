import sys, os
from PIL import Image
import numpy as np
def an(path):
    im = np.asarray(Image.open(path).convert('RGB')).astype(int)
    h,w,_ = im.shape
    r,g,b = im[...,0],im[...,1],im[...,2]
    yel = (r>=230)&(g>=210)&(b<=205)&(r-b>=40)
    # restrict to pdf region x 100..1200, y 500..2400
    ycnt = yel[:,100:1200].sum(1)
    rows = [y for y in range(500,2400) if ycnt[y]>=150]
    bands=[]
    for y in rows:
        if bands and y-bands[-1][1]<=3: bands[-1][1]=y
        else: bands.append([y,y])
    # page top: first y>600 where x in 400..900 all >=250
    dark = ((r+g+b)/3 < 120)[:,350:950].sum(1)
    pt=None
    for y in range(600,1500):
        if (im[y,400:900].mean()>=250): pt=y;break
    # text lines: clusters of rows with >=6 dark px, beyond pt
    lines=[];cur=None
    for y in range(pt,pt+1000):
        if dark[y]>=4:
            if cur and y-cur[1]<=4: cur[1]=y
            else:
                cur=[y,y]; lines.append(cur)
    return pt,bands,lines
if __name__=='__main__':
    for p in sys.argv[1:]:
        pt,bands,lines=an(p)
        out=[]
        for b0,b1 in bands:
            idx=[i for i,(l0,l1) in enumerate(lines[:9]) if min(b1,l1)-max(b0,l0)>=0]
            out.append(f"band {b0}-{b1}(c{(b0+b1)//2}, rel{(b0+b1)//2-pt}) lines{idx}")
        print(p.split('/')[-2], os.path.basename(p)[:2], 'pagetop',pt, ' | '.join(out), '| lines0-8', [(l0-pt) for l0,l1 in lines[:9]])
