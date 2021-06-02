<template>
    <div class="password-reset">
        <div class="reset-form" v-if="token">
            <div style="color: red; margin-bottom: 10px;">{{error}}</div>
            <b-form @submit="onSubmit">
                <b-form-group 
                    :label="(userTrans.new_password || 'new password') + ':'" 
                    label-for="reset-password">
                    <b-form-input
                        id="reset-password"
                        v-model="form.password"
                        type="password"
                        required
                    ></b-form-input>
                </b-form-group>

                <b-form-group 
                    :label="(userTrans.confirm_password || 'confirm password') + ':'"  
                    label-for="confirm-password">
                    <b-form-input
                        id="confirm-password"
                        type="password"
                        v-model="form.confirmPassword"
                        required
                    ></b-form-input>
                </b-form-group>

                <b-button class="w-100 mt-2" variant="outline-success" type="submit">
                    Reset
                </b-button>
            </b-form>
        </div>
    </div>
</template>

<script>
import {mapState, mapActions} from 'vuex';

export default {
    name: 'password-reset',
    data () {
        return {
            form: {
                password: '',
                confirmPassword: ''
            },
            error: ''
        }
    },
    computed: {
        ...mapState({
            userTrans: state => state.userTrans || {}
        }),
        token () {
            var uri = window.location.search;

            var queryString = {};
            uri.replace(
                new RegExp(
                    "([^?=&]+)(=([^&#]*))?", "g"),
                    function($0, $1, $2, $3) {
                        queryString[$1] = decodeURIComponent($3.replace(/\+/g, '%20'));
                    }
                );
            return queryString.token;
        }
    },
    methods: {
        ...mapActions([
            'resetPassword'
        ]),
        onSubmit (evt) {
            evt.preventDefault();
            const {password, confirmPassword} = this.form;

            this.error = '';

            if (password == confirmPassword) {
                this.resetPassword({
                    password: password,
                    token: this.token
                })
            } else {
                this.error = 'Passwords do not match!'
            }
        }
    }
}
</script>

<style lang="scss" scoped>
    .reset-form {
        width: 360px;
        margin-left: 50px;
        margin-top: 50px;
    }
</style>
