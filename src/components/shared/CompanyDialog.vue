<template>
  <v-dialog v-model="show" persistent max-width="1000px">
    <v-card dark flat v-bind:ripple="false">
      <v-list-item three-line style="padding-left: 0px">
        <div>
          <v-list-item-avatar tile style="margin: 6px; height: 150px; width: 120px">
            <!-- <v-img
              v-if="personData.Photo_URL"
              contain
              v-bind:src="personData.Photo_URL"
              style="border-radius: 6px;"
            ></v-img> -->
          </v-list-item-avatar>
        </div>
        <v-list-item-content class="align-self-start" style="padding-top: 6px; padding-bottom: 6px">
          <v-col style="padding: 0px!important" sm="12">
            <v-row>
              <div style="margin-left: 16px">
                <v-list-item-title class="headline mb-2" style="margin-bottom: 0px!important">
                  {{ Company_Name }}
                  <span v-if="isScraping">(loading, please wait...)</span>
                </v-list-item-title>
              </div>
            </v-row>

            <!-- <v-row style="margin-left: 4px; margin-right: 6px; margin-bottom: 8px">
              <div v-if="!showLongBio" style="font-size: .875rem; font-weight: normal" class="Clickable" v-on:click.stop="showLongBio = true">
                {{ personData.ShortBio }}
              </div>
              <div v-if="showLongBio" style="font-size: .875rem; font-weight: normal" class="Clickable" v-on:click.stop="showLongBio = false">
                <p v-for="(line, index) in personData.LongBio.split('\n')" v-bind:key="index">{{line}}</p>
              </div>
            </v-row> -->
          </v-col>
        </v-list-item-content>
      </v-list-item>
      <v-col sm="12">
        <v-row style="margin-top: 8px">
          <v-btn
            class="xs-fullwidth"
            color="secondary"
            v-on:click.native="onCloseClick"
            style="margin-left: 8px;"
          >Close</v-btn>
          <v-btn
            class="xs-fullwidth"
            color="primary"
            v-on:click.stop="openIMDB()"
            style="margin-left: 8px;"
          >Open IMDB</v-btn>
          <v-btn
            class="xs-fullwidth"
            color="primary"
            v-on:click.native="onFilterClick"
            style="margin-left: 8px;"
          >Filter by this company</v-btn>
        </v-row>
      </v-col>
    </v-card>
  </v-dialog>
</template>

<script>
import * as store from "@/store";
import * as helpers from "@/helpers/helpers";
const logger = require("loglevel");

const { shell } = require("electron").remote;

import { eventBus } from "@/main";

export default {
  props: ["show", "IMDB_Company_ID", "Company_Name"],

  data() {
    return {
      isScraping: false,
      personData: {},
      showLongBio: false
    };
	},
	
	watch: {
		IMDB_Person_ID: function(newVal) {
			this.init(newVal);
		}
	},

  methods: {
    onButtonClick(eventName) {
      this.$emit(eventName, {
        dontAskAgain: this.dontAskAgainValue,
        textValue: this.textValueLocal
      });

      this.resetData();
    },

    async scrapeData() {
      // TODO: scrape from IMDB.com
      logger.log("PersonDialog SCRAPE!");
      this.isScraping = true;

      try {
        // const personData = await store.scrapeIMDBPersonData(
        //   this.IMDB_Person_ID
        // );

        // logger.log("scraped personData:", personData);

        // this.personData = {
        //   IMDB_Person_ID: personData.$IMDB_Person_ID,
        //   Photo_URL: personData.$Photo_URL
        //     ? helpers.getPath(personData.$Photo_URL)
        //     : personData.$Photo_URL,
        //   ShortBio: personData.$ShortBio,
        //   LongBio: personData.$LongBio
        // };

        // logger.log("this.personData:", this.personData);

        // TODO: save to tbl_IMDB_Persons
      } catch (err) {
        logger.log(err);
        eventBus.showSnackbar(
          "error",
          6000,
          "an error occured while fetching data from the web"
        );
      }

      this.isScraping = false;
    },

    async init(IMDB_Person_ID) {
      // TODO: fetch data for this person from DB
      // TODO: if no data available, try to scrape it
      logger.log("CompanyDialog INIT!");
      this.personData = {};
      this.showLongBio = false;

			// let personData = await store.fetchIMDBPerson(IMDB_Person_ID);

			// logger.log('fetched personData:', personData);

      // if (!personData || personData.length === 0) {
			// 	await this.scrapeData();
			// 	return;
			// }
			
			// personData = personData[0];

			// personData.Photo_URL = personData.Photo_URL
      //       ? helpers.getPath(personData.Photo_URL)
      //       : personData.Photo_URL;

			this.personData = personData;

			logger.log('this.personData:', this.personData);
    },

    onCloseClick() {
      this.$emit("close");
    },

    async onFilterClick() {
			await store.addFilterCompany(this.IMDB_Company_ID, this.Company_Name);

			const setFilter = {
				filterCompanies: [
					this.IMDB_Company_ID
				]
			};

			eventBus.refetchFilters(setFilter);
			
			this.$emit("close");
    },

    openIMDB() {
      shell.openExternal(`https://www.imdb.com/company/${this.IMDB_Company_ID}`);
    }
  },

  // ### Lifecycle Hooks ###
  created() {}
};
</script>

<style scoped>
.btn {
  margin: 2px;
}

.input-group--text-field {
  padding-left: 16px;
  /* padding-top: 0px; */
}

@media screen and (max-width: 599px) {
  .input-group--text-field {
    padding-left: 16px;
    padding-top: 0px;
  }
}
</style>
