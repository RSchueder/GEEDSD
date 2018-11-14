# -*- coding: utf-8 -*-
"""
Created on Fri Oct 26 15:47:11 2018

@author: schueder
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

font = {'family' : 'normal',
        'size'   : 22}

plt.rc('font', **font)
plt.close('all')
dat = pd.read_csv(r'd:\Google Drive\GEE\pixel_extraction.csv')

def make_ts(var):
    return pd.Timestamp(str(var))

dat['timestr'] = dat['date'].apply(make_ts)
dat[dat['SPM'] < 0] = np.nan
dat.dropna(axis = 0, inplace = True)
for loc in dat['Name'].unique():
    sub = dat[dat['Name'] == loc]
    plt.plot(sub['timestr'],sub['SPM'], '.-', label = loc, MarkerSize = 12)

plt.legend()
plt.xlabel('time')
plt.ylabel('SPM signal [mg/l]')
plt.ylim([0,200])
