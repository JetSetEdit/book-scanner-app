/**
 * State-specific support services for Australia
 * Organized by state and service type
 */

export interface StateService {
  name: string
  phone?: string
  url: string
  description?: string
}

export interface StateServices {
  [state: string]: {
    domesticViolence?: StateService[]
    mentalHealth?: StateService[]
    substanceUse?: StateService[]
    lgbtqia?: StateService[]
    general?: StateService[]
  }
}

export const STATE_SERVICES: StateServices = {
  NSW: {
    domesticViolence: [
      {
        name: 'Domestic Violence Line NSW',
        phone: '1800 656 463',
        url: 'https://www.facs.nsw.gov.au/domestic-violence',
        description: '24/7 NSW domestic violence support'
      },
      {
        name: 'Link2Home',
        phone: '1800 152 152',
        url: 'https://www.facs.nsw.gov.au/housing/help/homelessness/link2home',
        description: 'NSW homelessness and crisis accommodation'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Line NSW',
        phone: '1800 011 511',
        url: 'https://www.health.nsw.gov.au/mentalhealth/Pages/default.aspx',
        description: 'NSW mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'NSW Alcohol & Drug Information Service',
        phone: '1800 250 015',
        url: 'https://adf.org.au/help-support/',
        description: 'NSW-specific substance use support'
      }
    ],
    lgbtqia: [
      {
        name: 'ACON',
        phone: '1800 063 060',
        url: 'https://www.acon.org.au/',
        description: 'NSW LGBTIQA+ health and support'
      }
    ]
  },
  VIC: {
    domesticViolence: [
      {
        name: 'Safe Steps',
        phone: '1800 015 188',
        url: 'https://www.safesteps.org.au/',
        description: 'Victoria family violence response'
      },
      {
        name: 'Orange Door',
        phone: '1800 319 354',
        url: 'https://orangedoor.vic.gov.au/',
        description: 'Victoria family violence support'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Triage Victoria',
        phone: '1300 874 243',
        url: 'https://www.health.vic.gov.au/mental-health-services',
        description: 'Victoria mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'DirectLine Victoria',
        phone: '1800 888 236',
        url: 'https://www.directline.org.au/',
        description: 'Victoria alcohol and drug support'
      }
    ],
    lgbtqia: [
      {
        name: 'Switchboard Victoria',
        phone: '1800 184 527',
        url: 'https://switchboard.org.au/',
        description: 'Victoria LGBTIQA+ peer support'
      },
      {
        name: 'Thorne Harbour Health',
        phone: '1800 134 840',
        url: 'https://thorneharbour.org/',
        description: 'Victoria LGBTIQA+ health services'
      }
    ]
  },
  QLD: {
    domesticViolence: [
      {
        name: 'DVConnect',
        phone: '1800 811 811',
        url: 'https://www.dvconnect.org/',
        description: 'Queensland domestic violence support'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Access Line QLD',
        phone: '1300 642 255',
        url: 'https://www.health.qld.gov.au/clinical-practice/guidelines-procedures/clinical-staff/mental-health',
        description: 'Queensland mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'Queensland Alcohol and Drug Information Service',
        phone: '1800 177 833',
        url: 'https://adf.org.au/help-support/',
        description: 'Queensland substance use support'
      }
    ],
    lgbtqia: [
      {
        name: 'Open Doors Youth Service',
        phone: '1800 184 527',
        url: 'https://opendoors.net.au/',
        description: 'Queensland LGBTIQA+ youth support'
      }
    ]
  },
  WA: {
    domesticViolence: [
      {
        name: 'Women\'s Domestic Violence Helpline WA',
        phone: '1800 007 339',
        url: 'https://www.dcp.wa.gov.au/',
        description: 'Western Australia domestic violence support'
      },
      {
        name: 'Men\'s Domestic Violence Helpline WA',
        phone: '1800 000 599',
        url: 'https://www.dcp.wa.gov.au/',
        description: 'Western Australia men\'s domestic violence support'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Emergency Service WA',
        phone: '1300 555 788',
        url: 'https://www.health.wa.gov.au/',
        description: 'Western Australia mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'Alcohol and Drug Support Line WA',
        phone: '1800 198 024',
        url: 'https://adf.org.au/help-support/',
        description: 'Western Australia substance use support'
      }
    ],
    lgbtqia: [
      {
        name: 'WAAC',
        phone: '1800 184 527',
        url: 'https://waac.org.au/',
        description: 'Western Australia LGBTIQA+ support'
      }
    ]
  },
  SA: {
    domesticViolence: [
      {
        name: 'Domestic Violence Crisis Line SA',
        phone: '1800 800 098',
        url: 'https://www.sa.gov.au/topics/family-and-community/safety/domestic-violence',
        description: 'South Australia domestic violence support'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Triage SA',
        phone: '13 14 65',
        url: 'https://www.sahealth.sa.gov.au/',
        description: 'South Australia mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'Alcohol and Drug Information Service SA',
        phone: '1300 131 340',
        url: 'https://adf.org.au/help-support/',
        description: 'South Australia substance use support'
      }
    ],
    lgbtqia: [
      {
        name: 'SHINE SA',
        phone: '1800 184 527',
        url: 'https://www.shinesa.org.au/',
        description: 'South Australia LGBTIQA+ health services'
      }
    ]
  },
  TAS: {
    domesticViolence: [
      {
        name: 'Family Violence Response and Referral Line TAS',
        phone: '1800 608 122',
        url: 'https://www.safefromviolence.tas.gov.au/',
        description: 'Tasmania domestic violence support'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Services Helpline TAS',
        phone: '1800 332 388',
        url: 'https://www.health.tas.gov.au/',
        description: 'Tasmania mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'Alcohol and Drug Service TAS',
        phone: '1800 811 994',
        url: 'https://adf.org.au/help-support/',
        description: 'Tasmania substance use support'
      }
    ],
    lgbtqia: [
      {
        name: 'Working It Out',
        phone: '1800 184 527',
        url: 'https://www.workingitout.org.au/',
        description: 'Tasmania LGBTIQA+ support'
      }
    ]
  },
  ACT: {
    domesticViolence: [
      {
        name: 'Domestic Violence Crisis Service ACT',
        phone: '02 6280 0900',
        url: 'https://www.dvcs.org.au/',
        description: 'ACT domestic violence support'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Triage ACT',
        phone: '1800 629 354',
        url: 'https://www.health.act.gov.au/',
        description: 'ACT mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'Alcohol and Drug Service ACT',
        phone: '02 5124 9977',
        url: 'https://adf.org.au/help-support/',
        description: 'ACT substance use support'
      }
    ],
    lgbtqia: [
      {
        name: 'A Gender Agenda',
        phone: '1800 184 527',
        url: 'https://www.genderrights.org.au/',
        description: 'ACT LGBTIQA+ support'
      }
    ]
  },
  NT: {
    domesticViolence: [
      {
        name: 'Domestic Violence Crisis Service NT',
        phone: '1800 019 116',
        url: 'https://nt.gov.au/',
        description: 'Northern Territory domestic violence support'
      }
    ],
    mentalHealth: [
      {
        name: 'Mental Health Access Line NT',
        phone: '1800 682 288',
        url: 'https://health.nt.gov.au/',
        description: 'Northern Territory mental health support'
      }
    ],
    substanceUse: [
      {
        name: 'Alcohol and Other Drugs Service NT',
        phone: '1800 629 683',
        url: 'https://adf.org.au/help-support/',
        description: 'Northern Territory substance use support'
      }
    ],
    lgbtqia: [
      {
        name: 'Northern Territory AIDS and Hepatitis Council',
        phone: '1800 184 527',
        url: 'https://www.ntahc.org.au/',
        description: 'Northern Territory LGBTIQA+ support'
      }
    ]
  }
}

/**
 * Get state-specific services for a given state and service type
 */
export function getStateServices(state: string | null, serviceType: 'domesticViolence' | 'mentalHealth' | 'substanceUse' | 'lgbtqia'): StateService[] {
  if (!state || !STATE_SERVICES[state]) {
    return []
  }
  
  return STATE_SERVICES[state][serviceType] || []
}

/**
 * Get all state-specific services for a given state
 */
export function getAllStateServices(state: string | null): StateServices[string] | null {
  if (!state || !STATE_SERVICES[state]) {
    return null
  }
  
  return STATE_SERVICES[state]
}
